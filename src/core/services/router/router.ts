import { Strings } from 'tsbase/Functions/Strings';
import { AsyncObservable } from 'tsbase/Patterns/Observable/AsyncObservable';
import { Asap } from '../../../utilities/asap';
import { IXssSanitizerService, XssSanitizerService } from '../xssSanitizerService/xssSanitizerService';
import { Route } from './route';

export interface IRouter {
  Route: AsyncObservable<Route>;
  RouteHandled: string;
  CurrentRoute?: Route;
  RouteChangeScrollingEnabled: boolean;
  UseClientRouting(): void;
  RouteTo(href: string, push?: boolean): Promise<Route>;
  GetRouteFromHref(href: string): Route;
}

export class Router implements IRouter {
  private static instance: IRouter | null = null;
  public static Instance(
    mainWindow: Window = window,
    xssSanitizer: IXssSanitizerService = XssSanitizerService.Instance()
  ): IRouter {
    return this.instance || (this.instance = new Router(
      mainWindow,
      xssSanitizer
    ));
  }
  public static Destroy = () => Router.instance = null;

  public Route = new AsyncObservable<Route>();
  public RouteHandled = Strings.Empty;
  public CurrentRoute?: Route;
  public RouteChangeScrollingEnabled = true;

  private constructor(
    private mainWindow: Window,
    private xssSanitizer: IXssSanitizerService
  ) {
    this.Route.Subscribe(async (route?: Route) => {
      this.RouteHandled = Strings.Empty;

      if (route && this.RouteChangeScrollingEnabled) {
        Asap(() => {
          this.scrollToTopOrHash(route);
        });
      }
    });

    window.onpopstate = (async () => {
      await this.RouteTo(this.mainWindow.location.href, false);
    });
  }
  public UseClientRouting(): void {
    Asap(() => {
      const routeAttribute = 'routed';
      const anchorTags = this.mainWindow.document.querySelectorAll(
        `a:not([${routeAttribute}="true"]):not([target="_blank"])`) as NodeListOf<HTMLAnchorElement>;

      anchorTags.forEach(element => {

        element.setAttribute(routeAttribute, (true).toString());
        element.addEventListener('click', (e) => this.routeWithHistoryApi(e, element.href));
      });
    });
  }

  public async RouteTo(href: string, push = true): Promise<Route> {
    const route = this.GetRouteFromHref(href);
    await this.Route.Publish(route);

    if (push) {
      this.mainWindow.history.pushState(route, href, href);
    }

    return route;
  }

  public GetRouteFromHref(href: string): Route {
    const path = this.getCleanRoute(href);

    return {
      href: href,
      path: path,
      routeParams: path.split('/').filter(p => p.length >= 1).map(p => this.xssSanitizer.PlainText(decodeURI(p))),
      queryParams: this.getQueryParams(href),
      hashParams: this.getHashParams(href)
    } as Route;
  }

  private async routeWithHistoryApi(event: Event, href: string): Promise<void> {
    const isLocal = href.startsWith(this.mainWindow.location.origin);
    if (isLocal) {
      event.preventDefault();

      if (href !== this.mainWindow.location.href) {
        await this.RouteTo(href);
      }
    }
  }

  private getCleanRoute(href: string): string {
    const route = href.includes(location.origin) ?
      href.split(this.mainWindow.location.origin)[1] :
      href;

    let cleanRoute = route.indexOf('?') >= 0 ? route.split('?')[0] : route;
    cleanRoute = route.indexOf('#') >= 0 ? route.split('#')[0] : cleanRoute;

    if (cleanRoute.length > 1 && cleanRoute.endsWith('/')) {
      cleanRoute = cleanRoute.substring(0, cleanRoute.length - 1);
    }

    return cleanRoute.replace('.html', Strings.Empty);
  }

  private getQueryParams(href: string): Map<string, string> {
    href = this.splitFirstAway(href, '?');
    const queryParams = new Map<string, string>();

    if (href.length > 0) {
      if (href.indexOf('&') >= 0) {
        const keyValuePairs = href.split('&');
        keyValuePairs.forEach(element => {
          const keyValuePair = element.split('=');
          queryParams.set(keyValuePair[0], this.xssSanitizer.PlainText(decodeURI(keyValuePair[1])));
        });
      } else {
        const key = href.split('=')[0];
        const value = this.splitFirstAway(href, '=');
        queryParams.set(key, this.xssSanitizer.PlainText(decodeURI(value)));
      }
    }

    return queryParams;
  }

  private splitFirstAway(route: string, splitter: string): string {
    return route.indexOf(splitter) >= 0 ? (() => {
      const stringArray = route.split(splitter);
      stringArray.shift();
      return stringArray.join(splitter);
    })() : Strings.Empty;
  }

  private getHashParams(route: string): string[] {
    const hashSplitRouteStrings = route.indexOf('#') >= 0 ? route.split('#') : [];
    hashSplitRouteStrings.shift();
    return hashSplitRouteStrings.map(s => this.xssSanitizer.PlainText(decodeURI(s)));
  }

  private scrollToTopOrHash(route: Route) {
    const hashElementId = route.hashParams[0];
    if (hashElementId) {
      const hashElement = this.mainWindow.document.getElementById(hashElementId);
      if (hashElement) {
        this.mainWindow.scrollTo(0, hashElement.offsetTop - 50);
      }

    } else {
      this.mainWindow.scroll(0, 0);
    }
  }
}
