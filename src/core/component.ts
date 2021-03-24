import { Strings } from 'tsbase/Functions/Strings';
import { Guid } from 'tsbase/Functions/Guid';
import { Result } from 'tsbase/Patterns/Result/Result';
import { Command } from 'tsbase/Patterns/CommandQuery/Command';
import { IXssSanitizerService, Route, XssSanitizerService } from './services/module';
import { App } from './app';
import { EventTypes } from './eventTypes';
import { Jsx, JsxRenderer } from './jsx';

export abstract class Component {
  public static IssuedIds = new Array<string>();
  private routeSubscription: string = Strings.Empty;
  private ids = new Map<string, string>();

  /**
   * The unique id associated with this class rendered dom element
   */
  public Id: string;

  /**
   * Returns the rendered html element associated with this component
   */
  public get Element(): HTMLElement | null {
    return this.windowDocument.getElementById(this.Id);
  }

  constructor(
    routeSubscriber = true,
    protected windowDocument: Document = document,
    protected app = App.Instance(),
    private xssSanitizer: IXssSanitizerService = XssSanitizerService.Instance()
  ) {
    this.Id = `fj-${Guid.NewGuid()}`;
    Component.IssuedIds.push(this.Id);

    if (routeSubscriber) {
      this.routeSubscription = app.Router.Route.Subscribe(() => {
        this.setBehaviorIfComponentIsRendered();

        if (!this.Element) {
          app.Router.Route.Cancel(this.routeSubscription);
        }
      });
    }
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
    const html = await this.Html(route);
    const content = this.getOuterHtml(html);

    return includeWrapper ? /*html*/ `<div id="${this.Id}">${content}</div>` : content;
  }

  public Html: (route?: Route) => Promise<string | Jsx> = async () => Strings.Empty;

  /**
   * Behavior associated with the component - this is where you should attach event handlers
   */
  public Behavior: () => void = () => null;

  /**
   * Replace the currently rendered component's innerHtml with a fresh version then rerun behavior
   * @param route
   */
  protected async reRender(route?: Route): Promise<void> {
    if (this.Element) {
      this.Element.innerHTML = await this.Render(route, false);
      this.setBehaviorIfComponentIsRendered();
    }
  }

  /**
   * Returns the app store state at the given path and subscribes to changes triggering a re-render
   * @param statePath
   */
  protected useAppStore<T>(statePath: string): () => T | undefined {
    this.app.Store.ObservableAt<T>(statePath).Subscribe(() => {
      this.reRender(this.app.Router.CurrentRoute);
    });

    return () => this.app.Store.GetStateAt<T>(statePath);
  }

  /**
   * Add a given function as an event to the element with the corresponding id
   * @param id
   * @param eventType
   * @param func
   */
  protected addEventListenerToId(id: string, eventType: EventTypes, func: (event: Event | null) => any): Result {
    return new Command(() => {
      const element = this.windowDocument.getElementById(id) as HTMLElement;
      element.addEventListener(eventType, func);
    }).Execute();
  }

  /**
   * Returns a sanitized version of the given text (either plain text or html)
   * @param text
   * @param allowHtml
   */
  protected userInput(text: string, allowHtml = false): string {
    return allowHtml ?
      this.xssSanitizer.Html(text) :
      this.xssSanitizer.PlainText(text);
  }

  /**
   * Gets the value of the input with the given id and returns its sanitized version
   * @param inputId
   * @param allowHtml
   */
  protected getInputValue(inputId: string, allowHtml = false): string {
    type input = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const inputElement = this.windowDocument.getElementById(inputId) as input;
    return inputElement && inputElement.value ? this.userInput(inputElement.value, allowHtml) : Strings.Empty;
  }

  /**
   * Passes the flow of control and runs the behavior method
   */
  protected setBehaviorIfComponentIsRendered() {
    setTimeout(() => {
      if (this.Element) {
        this.Behavior();
      }
    });
  }

  private getOuterHtml(html: string | Jsx): string {
    if (typeof html === 'string') {
      return html;
    } else {
      return JsxRenderer.RenderJsx(html);
    }
  }
}
