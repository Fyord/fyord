import { RawHtml } from '../rawHtml';

describe('RawHtml', () => {
  let classUnderTest: RawHtml;
  const rawHtmlString = '<script></script>';

  beforeEach(() => {
    classUnderTest = new RawHtml(rawHtmlString);
  });

  it('should construct with default sanitizing on', async () => {
    expect(classUnderTest).toBeDefined();
    expect(await classUnderTest.Template()).toEqual(('&lt;script&gt;&lt;/script&gt;' as any));
  });

  it('should construct allowing html', async () => {
    classUnderTest = new RawHtml(rawHtmlString, false);
    expect(classUnderTest).toBeDefined();
    expect(await classUnderTest.Template()).toEqual((rawHtmlString as any));
  });

  it('should render', async () => {
    const render = await classUnderTest.Render();
    expect(render).toContain('&lt;script&gt;&lt;/script&gt;');
  });
});
