import { Strings } from 'tsbase/Functions/Strings';
import { Guid } from 'tsbase/Functions/Guid';
import { EventStore } from 'tsbase/Patterns/EventStore/EventStore';
import { IXssSanitizerService, Route, XssSanitizerService } from './services/module';
import { App as _App } from './app';
import { Jsx, JsxRenderer } from './jsx';

export type StateFunction<T> = (newValue?: T) => (T | undefined);

export abstract class Component {
  public static IssuedIds = new Array<string>();
  public State = new EventStore<any>();
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
    protected windowDocument: Document = document,
    public App = _App.Instance(),
    private xssSanitizer: IXssSanitizerService = XssSanitizerService.Instance()
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
    const html = await this.Html(route);
    const content = this.getOuterHtml(html);

    return includeWrapper ? /*html*/ `<div id="${this.Id}">${content}</div>` : content;
  }

  public Html: (route?: Route) => Promise<string | Jsx> = async () => Strings.Empty;

  /**
   * Replace the currently rendered component's innerHtml with a fresh version then rerun behavior
   * @param route
   */
  public async ReRender(route?: Route): Promise<void> {
    if (this.Element) {
      this.Element.innerHTML = await this.Render(route, false);
    }
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

  private getOuterHtml(html: string | Jsx): string {
    if (typeof html === 'string') {
      return html;
    } else {
      return JsxRenderer.RenderJsx(html);
    }
  }
}
