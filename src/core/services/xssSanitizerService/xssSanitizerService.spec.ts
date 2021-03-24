import { IXssSanitizerService, XssSanitizerService } from './xssSanitizerService';

describe('XssSanitizerService', () => {
  let classUnderTest: IXssSanitizerService;

  beforeEach(() => {
    classUnderTest = XssSanitizerService.Instance();
  });

  it('should construct', () => {
    expect(classUnderTest).toBeDefined();
  });

  it('should construct only once', () => {
    expect(classUnderTest).toBe(XssSanitizerService.Instance());
  });

  it('should strip all html when using PlainText', () => {
    const htmlToSanitize = '<h1>Test</h1>';
    expect(classUnderTest.PlainText(htmlToSanitize)).toEqual('Test');
  });

  it('should strip non-whitelisted attributes from html', () => {
    const htmlToSanitize = '<img src="/test.png" onerror="alert(\'fake\');">';
    expect(classUnderTest.Html(htmlToSanitize)).toEqual('<img src="/test.png">');
  });

  it('should not filter out common safe characters', () => {
    const safeCharacters = '\"\'!@#$%^&*()-=_+`\\/{};:[]~.?';
    expect(classUnderTest.PlainText(safeCharacters)).toEqual(safeCharacters);
  });
});
