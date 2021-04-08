import { Strings } from 'tsbase/Functions/Strings';
import { Route } from './services/router/route';
import { App } from './app';
import { Component } from './component';
import { ISeoService, SeoService } from './services/module';

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
  public abstract Route: (route: Route) => boolean;
  public Title: string = Strings.Empty;
  public Description: string = Strings.Empty;
  public ImageUrl: string = Strings.Empty;
  private boundPath = Strings.Empty;

  constructor(
    protected seoService: ISeoService = SeoService.Instance,
    app: App = App.Instance(),
    windowDocument: Document = document
  ) {
    super(false, windowDocument, app);

    app.Router.Route.Subscribe((route) => {
      this.handleRouteChange(route);
    });
  }

  private routeMatch = (route: Route | undefined) => !this.app.Router.RouteHandled && route && this.Route(route);

  private handleRouteChange(route: Route | undefined): void {
    if (this.routeMatch(route)) {
      const currentPath = (route as Route).path;
      const pathIsNew = currentPath !== this.boundPath;

      if (!this.Element || pathIsNew) {
        this.boundPath = currentPath;
        this.renderPageInMain(route as Route);
        this.setBehaviorIfComponentIsRendered();
      }

      this.app.Router.RouteHandled = this.Id;
    } else {
      this.boundPath = Strings.Empty;
    }
  }

  private async renderPageInMain(route: Route) {
    this.seoService.SetDefaultTags(this.Title, this.Description, this.ImageUrl);
    const markup = await this.Render(route);
    if (this.app.Router.RouteHandled === this.Id) {
      this.app.Main.innerHTML = `${markup}\n${this.RenderMode}`;
    }
  }
}
