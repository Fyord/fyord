import { Strings } from 'tsbase/Functions/Strings';
import { Observable } from 'tsbase/Patterns/Observable/Observable';
import { IXssSanitizerService, XssSanitizerService } from '../xssSanitizerService/xssSanitizerService';
import { Route } from './route';

export interface IRouter {
  Route: Observable<Route>;
  RouteHandled: string;
  CurrentRoute?: Route;
  UseClientRouting(): void;
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

  public Route = new Observable<Route>();
  public RouteHandled = Strings.Empty;
  public CurrentRoute?: Route;

  private constructor(
    private mainWindow: Window,
    private xssSanitizer: IXssSanitizerService
  ) {
    this.Route.Subscribe(() => this.RouteHandled = Strings.Empty);
  }

  public UseClientRouting(): void {
    this.Route.Subscribe(() => {
      this.passFlowOfControlAndUpdateRenderedAnchorTags();
    });

    window.onpopstate = (() => {
      this.routeTo(this.mainWindow.location.href);
    });
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

  private passFlowOfControlAndUpdateRenderedAnchorTags(): void {
    setTimeout(() => {
      const anchorTags = this.mainWindow.document.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;

      anchorTags.forEach(element => {
        const routeAttribute = 'routed';

        if (!element.getAttribute(routeAttribute)) {
          element.setAttribute(routeAttribute, (true).toString());
          element.addEventListener('click', (e) => this.routeWithHistoryApi(e, element.href, element.target));
        }
      });
    });
  }

  private routeWithHistoryApi(event: Event, href: string, target: string): void {
    const isLocal = href.startsWith(this.mainWindow.location.origin);
    if (isLocal && target !== '_blank') {
      event.preventDefault();

      if (href !== this.mainWindow.location.href) {
        const route = this.routeTo(href);
        this.mainWindow.history.pushState(route, href, href);
      }
    }
  }

  private routeTo(href: string): Route {
    const route = this.GetRouteFromHref(href);
    this.Route.Publish(route);

    return route;
  }

  private getCleanRoute(href: string): string {
    const route = href.split(this.mainWindow.location.host)[1] as string | undefined;

    if (route) {
      let cleanRoute = route.indexOf('?') >= 0 ? route.split('?')[0] : route;
      cleanRoute = route.indexOf('#') >= 0 ? route.split('#')[0] : cleanRoute;

      if (cleanRoute.length > 1 && cleanRoute.endsWith('/')) {
        cleanRoute = cleanRoute.substring(0, cleanRoute.length - 1);
      }

      return cleanRoute.replace('.html', Strings.Empty);
    } else {
      return href;
    }
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
}
