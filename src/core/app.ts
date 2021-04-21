import { Command } from 'tsbase/Patterns/CommandQuery/Command';
import { EventStore } from 'tsbase/Patterns/EventStore/module';
import { Observable } from 'tsbase/Patterns/Observable/module';
import { Logger } from 'tsbase/Utility/Logger/Logger';
import { Strings } from 'tsbase/Functions/Strings';
import { Environments } from './environments';
import { IRouter, Router } from './services/module';
import { Jsx, JsxRenderer } from './jsx';

const rootId = 'app-root';
const defaultAttribute = 'default';
const rootElementIds = {
  layout: `${rootId}-layout`
};

export class App {
  private static loggerSubscription: string | null = null;
  private static environment: Environments;
  private static instance: App | null = null;

  // eslint-disable-next-line max-params
  public static Instance(
    environment?: string,
    productionEnvironmentVariables = new Map<string, string>(),
    developmentEnvironmentVariables = new Map<string, string>(),
    router: IRouter = Router.Instance(),
    windowDocument: Document = document,
    mainConsole = globalThis.console
  ): App {
    if (this.instance === null) {
      App.environment = environment === Environments.Development ? Environments.Development : Environments.Production;
      this.instance = new App(router, windowDocument, mainConsole, productionEnvironmentVariables, developmentEnvironmentVariables);
    }

    return this.instance;
  }
  public static Destroy = () => {
    if (App.loggerSubscription) {
      Logger.Instance.EntryLogged.Cancel(App.loggerSubscription);
    }

    App.loggerSubscription = null;
    App.instance = null;
  }

  public get Main(): HTMLElement {
    return this.windowDocument.querySelector('main') as HTMLElement;
  }
  private get appRoot(): HTMLElement {
    return this.windowDocument.getElementById(rootId) as HTMLElement;
  }

  public EnvironmentVariables = new Map<string, string>();
  public Logger = Logger.Instance;
  public Store = new EventStore<any>();
  public Layout = new Observable<Jsx>();

  private constructor(
    public Router: IRouter,
    private windowDocument: Document,
    mainConsole: Console,
    productionEnvironmentVariables: Map<string, string>,
    developmentEnvironmentVariables: Map<string, string>
  ) {
    if (App.environment === Environments.Production) {
      this.EnvironmentVariables = productionEnvironmentVariables;
    } else {
      this.EnvironmentVariables = developmentEnvironmentVariables;

      App.loggerSubscription = this.Logger.EntryLogged.Subscribe(logEntry => mainConsole.warn(logEntry));
    }
  }

  public InitializeStore<T>(state: T): void {
    this.Store.SetStateAt<T>(state, Strings.Empty);
  }

  public async Start(initialLayout: () => Promise<Jsx>): Promise<void> {
    const layoutContents = await initialLayout();
    const layout = typeof layoutContents === 'string' ? layoutContents : JsxRenderer.RenderJsx(layoutContents);

    this.appRoot.innerHTML = `<div id="${rootElementIds.layout}" ${defaultAttribute}="true">${layout}</div>`;
    this.Router.UseClientRouting();
    this.Router.Route.Publish(this.Router.GetRouteFromHref(location.href));

    this.restoreDefaultLayoutOnRoute(layout);
    this.subscribeToLayoutChanges();
  }

  private restoreDefaultLayoutOnRoute(layout: string) {
    this.Router.Route.Subscribe(() => {
      this.setRootElement(rootElementIds.layout, layout || Strings.Empty, true);
    });
  }

  private subscribeToLayoutChanges() {
    this.Layout.Subscribe(layout => {
      this.setRootElement(rootElementIds.layout, (layout ? JsxRenderer.RenderJsx(layout) : Strings.Empty), false);
    });
  }

  private setRootElement(elementId: string, contents: string, defaultElement): void {
    new Command(() => {
      const rootElement = this.windowDocument.getElementById(elementId) as HTMLElement;
      const currentElementIsDefault = rootElement.getAttribute(defaultAttribute) === 'true';

      if (rootElement && (!currentElementIsDefault || !defaultElement)) {
        rootElement.innerHTML = contents;
        rootElement.setAttribute(defaultAttribute, defaultElement.toString());
      }
    }).Execute();
  }
}
