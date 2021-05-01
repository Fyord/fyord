import { Guid } from 'tsbase/Functions/Guid';
import { EventStore } from 'tsbase/Patterns/EventStore/EventStore';
import { Route } from './services/router/route';
import { App as _App } from './app';
import { Jsx, JsxRenderer } from './jsx';
import { RecursiveReRender } from '../utilities/recursiveReRender';

export type StateFunction<T> = (newValue?: T) => (T | undefined);

export abstract class Component {
  public static IssuedIds = new Array<string>();
  public State = new EventStore<any>();
  private ids = new Map<string, string>();

  /**
   * The unique id associated with this class rendered dom element
   */
  public Id: string;

  public get Element(): HTMLElement | null {
    return this.windowDocument.getElementById(this.Id);
  }

  constructor(
    protected windowDocument: Document = document,
    public App = _App.Instance()
  ) {
    this.Id = `fy-${Guid.NewGuid()}`;
    Component.IssuedIds.push(this.Id);
  }

  /**
   * Returns a unique id for the given key scoped to the component instance
   * @param key
   */
  public Ids(key: string): string {
    if (!this.ids.has(key)) {
      this.ids.set(key, `${key}-${Guid.NewGuid()}`);
    }
    return this.ids.get(key) as string;
  }

  /**
   * Returns the markup output of the component to be rendered to the dom, including html
   * @param route
   */
  public async Render(route?: Route, includeWrapper = true): Promise<string> {
    const content = this.getOuterHtml(await this.Template(route));
    return includeWrapper ? /*html*/ `<div id="${this.Id}">${content}</div>` : content;
  }

  public abstract Template: (route?: Route) => Promise<Jsx>;

  /**
   * Replace the currently rendered component's innerHtml with a fresh version then rerun behavior
   * @param route
   */
  public async ReRender(route?: Route): Promise<void> {
    if (this.Element) {
      const newRender = await this.Render(route, false);

      const newElement = document.createElement('div');
      newElement.innerHTML = newRender;

      RecursiveReRender(this.Element, newElement);
    }
  }

  private getOuterHtml(html: string | Jsx): string {
    if (typeof html === 'string') {
      return html;
    } else {
      return JsxRenderer.RenderJsx(html);
    }
  }
}
