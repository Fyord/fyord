import { RawHtml } from '../rawHtml';

describe('RawHtml', () => {
  let classUnderTest: RawHtml;
  const rawHtmlString = '<script></script>';

  beforeEach(() => {
    classUnderTest = new RawHtml(rawHtmlString);
  });

  it('should construct with default sanitizing on', async () => {
    expect(classUnderTest).toBeDefined();
    expect(await classUnderTest.Html()).toEqual('&lt;script&gt;&lt;/script&gt;');
  });

  it('should construct allowing html', async () => {
    classUnderTest = new RawHtml(rawHtmlString, false);
    expect(classUnderTest).toBeDefined();
    expect(await classUnderTest.Html()).toEqual(rawHtmlString);
  });
});
