import { Component } from '../core/module';

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

  Template = async () => `${this.rawHtml}`;
}
