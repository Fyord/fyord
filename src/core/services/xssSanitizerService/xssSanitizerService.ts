import { FilterXSS, IFilterXSSOptions, IWhiteList } from 'xss';

const defaultPlainTextFilterOptions: IFilterXSSOptions = {
  whiteList: {} as IWhiteList,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
};

const defaultHtmlFilterOptions: IFilterXSSOptions = {
  css: false
};

export interface IXssSanitizerService {
  PlainText(userInput: string): string;
  Html(userInput: string): string;
}

export class XssSanitizerService implements IXssSanitizerService {
  private static instance: IXssSanitizerService | null = null;
  public static Instance(
    plainTextFilterOptions: IFilterXSSOptions = defaultPlainTextFilterOptions,
    htmlFilterOptions: IFilterXSSOptions = defaultHtmlFilterOptions
  ): IXssSanitizerService {
    return this.instance || (this.instance = new XssSanitizerService(plainTextFilterOptions, htmlFilterOptions));
  }

  private plainTextSanitizer: FilterXSS;
  private htmlSanitizer: FilterXSS;

  private constructor(
    plainTextFilterOptions: IFilterXSSOptions,
    htmlFilterOptions: IFilterXSSOptions
  ) {
    this.plainTextSanitizer = new FilterXSS(plainTextFilterOptions);
    this.htmlSanitizer = new FilterXSS(htmlFilterOptions);
  }

  public PlainText(userInput: string): string {
    return this.plainTextSanitizer.process(userInput);
  }

  public Html(userInput: string): string {
    return this.htmlSanitizer.process(userInput);
  }
}
