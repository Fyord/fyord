import { AsyncCommand } from 'tsbase/Patterns/CommandQuery/AsyncCommand';
import { EventStore } from 'tsbase/Patterns/EventStore/module';
import { Logger } from 'tsbase/Utility/Logger/Logger';
import { Strings } from 'tsbase/System/Strings';
import { Environments } from './environments';
import { IRouter, Router } from './services/module';
import { Jsx, JsxRenderer } from './jsx';

const rootId = 'app-root';
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
  public static Destroy(): void {
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
  private currentLayout?: Jsx;
  private defaultLayout: string = '';


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
    this.Store.SetStateAt<T>(Strings.Empty, state);
  }

  public async Start(initialLayout: () => Promise<Jsx>): Promise<void> {
    const initialLayoutJsx = await initialLayout();
    this.defaultLayout = JsxRenderer.RenderJsx(initialLayoutJsx);

    this.appRoot.innerHTML = `<div id="${rootElementIds.layout}">${this.defaultLayout}</div>`;

    await this.Router.Route.Publish(this.Router.GetRouteFromHref(location.href));
  }

  public UpdateLayout(newLayout?: () => Promise<Jsx>): Promise<any> {
    return new AsyncCommand(async () => {
      const rootElement = this.windowDocument.getElementById(rootElementIds.layout) as HTMLElement;

      if (newLayout) {
        const newLayoutJsx = await newLayout();
        if (this.currentLayout !== newLayoutJsx) {
          this.currentLayout = newLayoutJsx;
          rootElement.innerHTML = JsxRenderer.RenderJsx(newLayoutJsx);
        }
      } else {
        rootElement.innerHTML = this.defaultLayout;
      }
    }).Execute();
  }
}
