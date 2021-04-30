import { Component, IXssSanitizerService, Jsx, XssSanitizerService } from '../core/module';

export class RawHtml extends Component {
  constructor(
    private rawHtml: string,
    sanitize = true,
    xssSanitizerService: IXssSanitizerService = XssSanitizerService.Instance()
  ) {
    super();

    if (sanitize) {
      this.rawHtml = xssSanitizerService.Html(rawHtml);
    }
  }

  Template = async () => `${this.rawHtml}` as unknown as Jsx;
}
