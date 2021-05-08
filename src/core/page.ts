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
  public abstract Route: (route: Route) => Promise<boolean>;
  public Title: string = Strings.Empty;
  public Description: string = Strings.Empty;
  public ImageUrl: string = Strings.Empty;
  private boundPath = Strings.Empty;

  constructor(
    protected seoService: ISeoService = SeoService.Instance,
    app: App = App.Instance(),
    windowDocument: Document = document
  ) {
    super(windowDocument, app);

    app.Router.Route.Subscribe(async (route) => {
      await this.handleRouteChange(route);
    });
  }

  private routeMatch = async (route: Route | undefined) =>
    !this.App.Router.RouteHandled &&
    route &&
    await this.Route(route);

  private async handleRouteChange(route: Route | undefined): Promise<void> {
    if (await this.routeMatch(route)) {
      const currentPath = (route as Route).path;
      const pathIsNew = currentPath !== this.boundPath;

      if (!this.Element || pathIsNew) {
        this.boundPath = currentPath;
        this.App.Router.RouteHandled = this.Id;
        await this.renderPageInMain(route as Route);
      }

    } else {
      this.boundPath = Strings.Empty;
    }
  }

  private async renderPageInMain(route: Route) {
    this.seoService.SetDefaultTags(this.Title, this.Description, this.ImageUrl);
    const markup = await this.Render(route);
    this.App.Main.innerHTML = `${markup}\n${this.RenderMode}`;
    this.App.Router.UseClientRouting();
  }
}
