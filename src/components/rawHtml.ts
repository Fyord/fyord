import { Component, Jsx } from '../core/module';

export class RawHtml extends Component {
  constructor(
    private rawHtml: string,
    sanitize = true
  ) {
    super();

    if (sanitize) {
      this.rawHtml = this.userInput(rawHtml, true);
    }
  }

  Template = async () => `${this.rawHtml}` as unknown as Jsx;
}
