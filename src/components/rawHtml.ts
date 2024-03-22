import { Component, Jsx, XssSanitizerService } from '../core/module';

export class RawHtml extends Component {
  constructor(
    private rawHtml: string,
    sanitize = true,
    xssSanitizerService = XssSanitizerService.Instance()
  ) {
    super();

    if (sanitize) {
      this.rawHtml = xssSanitizerService.Html(rawHtml);
    }
  }

  Template = async () => `${this.rawHtml}` as unknown as Jsx;
}
