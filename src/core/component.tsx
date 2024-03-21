import { Guid } from 'tsbase/System/Guid';
import { EventStore } from 'tsbase/Patterns/EventStore/EventStore';
import { Route } from './services/router/route';
import { App as _App } from './app';
import { Jsx, JsxRenderer } from './jsx';
import { RecursiveReRender } from '../utilities/recursiveReRender';
import { Asap } from '../utilities/asap';

export abstract class Component {
  public static IssuedIds = new Array<string>();

  /**
   * The unique id associated with this class rendered dom element
   */
  public Id: string;
  public State = new EventStore<any>({});
  public get Element(): HTMLElement | null {
    return this.windowDocument.getElementById(this.Id);
  }
  protected RootElementDisplayStyle: 'block' | 'inline-block' = 'inline-block';

  private ids = new Map<string, string>();
  private mutationObserver: MutationObserver;
  private reRenderQueued = false;

  constructor(
    protected windowDocument: Document = document,
    public App = _App.Instance()
  ) {
    this.Id = `fy-${Guid.NewGuid()}`;
    Component.IssuedIds.push(this.Id);

    this.mutationObserver = new MutationObserver(() => {
      if (!this.Element) {
        this.mutationObserver.disconnect();
        this.Disconnected();
      }
    });
  }

  /**
   * The html template or view representing this component
   */
  protected abstract Template: (route?: Route) => Promise<Jsx>;

  /**
   * Returns the render-able html from the component's template
   * @param route
   */
  public async Render(route?: Route, includeWrapper = true): Promise<string> {
    Asap(() => {
      if (this.Element && this.Element.parentElement) {
        this.mutationObserver.observe(this.Element.parentElement, { childList: true });
      }
    });

    const content = await this.getOuterHtml(await this.Template(route));

    return includeWrapper ? /*html*/ `<div id="${this.Id}" style="display: ${this.RootElementDisplayStyle};">${content}</div>` : content;
  }

  /**
   * Replace the currently rendered component's innerHtml with a fresh version then rerun behavior
   * @param route
   */
  public async ReRender(route?: Route): Promise<void> {
    if (!this.reRenderQueued) {
      this.reRenderQueued = true;
      Asap(async () => {
        if (this.Element) {
          const elementsWithRefs = Array.from(this.Element.querySelectorAll('[ref]'));
          const refs = new Array<string>();
          elementsWithRefs.forEach(e => {
            refs.push(e.getAttribute('ref') as string);
            e.removeAttribute('ref');
          });

          const newRender = await this.Render(route, false);
          const newElement = document.createElement('div');
          newElement.innerHTML = newRender;

          elementsWithRefs.forEach((e, i) => {
            e.setAttribute('ref', refs[i]);
          });

          RecursiveReRender(this.Element, newElement);
          this.App.Router.UseClientRouting();
          this.reRenderQueued = false;
        } else {
          this.reRenderQueued = false;
        }
      });
    }
  }

  protected Disconnected: () => void = () => null;

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

  private async getOuterHtml(html: string | Jsx): Promise<string> {
    if (typeof html === 'string') {
      return html;
    } else {
      return await JsxRenderer.RenderJsx(html);
    }
  }
}
