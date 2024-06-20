import { Strings } from 'tsbase/System/Strings';
import { Route } from './services/router/route';
import { App } from './app';
import { Component } from './component';
import { ISeoService, SeoService } from './services/module';
import { Jsx } from './jsx';

export enum RenderModes {
  Dynamic = '<!-- fyord-dynamic-render -->',
  Static = '<!-- fyord-static-render -->',
  Hybrid = '<!-- fyord-hybrid-render -->'
}

export abstract class Page extends Component {
  /**
   * Sets the render mode of the page - used during pre-rendering
   */
  public RenderMode = RenderModes.Hybrid;
  /**
   * Sets the predicate by which a route match is determined
   */
  protected abstract Route: (route: Route) => Promise<boolean>;
  protected Title: string = Strings.Empty;
  protected Description: string = Strings.Empty;
  protected ImageUrl: string = Strings.Empty;
  protected Layout?: () => Promise<Jsx>;
  protected HeadElements: Omit<Jsx, 'children'>[] = [];
  private boundHref = Strings.Empty;

  constructor(
    protected seoService: ISeoService = SeoService.Instance,
    app: App = App.Instance(),
    windowDocument: Document = document
  ) {
    super(windowDocument, app);

    this.RootElementDisplayStyle = 'block';

    app.Router.Route.Subscribe(async (route) => {
      await this.handleRouteChange(route);
    });
  }

  private routeMatch = async (route?: Route) =>
    !this.App.Router.RouteHandled &&
    route &&
    await this.Route(route);

  private async handleRouteChange(route?: Route): Promise<void> {
    if (await this.routeMatch(route)) {
      const currentHref = (route as Route).href;
      const hrefIsNew = currentHref !== this.boundHref;
      this.boundHref = currentHref;
      this.App.Router.RouteHandled = this.Id;

      if (!this.Element || hrefIsNew) {
        await this.renderPageInMain(route as Route);
      }
    } else if (this.App.Router.RouteHandled !== this.Id) {
      this.boundHref = Strings.Empty;
      Array.from(this.windowDocument.head.querySelectorAll('[dynamic=true]'))
        .forEach(e => e.remove());
    }
  }

  private async renderPageInMain(route: Route): Promise<void> {
    await this.App.UpdateLayout(this.Layout);
    this.seoService.SetDefaultTags(this.Title, this.Description, this.ImageUrl);
    this.HeadElements.forEach(e => {
      e.attributes['dynamic'] = 'true';
      const newElement = this.windowDocument.createElement(e.nodeName);
      for (const key in e.attributes) {
        const value = e.attributes[key];
        newElement.setAttribute(key, value);
      }
      this.windowDocument.head.appendChild(newElement);
    });

    const markup = await this.Render(route);
    this.App.Main.innerHTML = `${markup}\n${this.RenderMode}`;
    this.App.Router.UseClientRouting();
  }
}
