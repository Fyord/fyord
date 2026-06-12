import { JsxRenderer, ParseJsx } from '../jsx';

const dangerousUriSchemes = [
  'javascript:alert(1)',
  'javascript:void(0)',
  'JAVASCRIPT:alert(1)',
  '  javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  '  vbscript:msgbox(1)'
];

const safeUriValues = [
  'https://example.com',
  '/relative/path',
  '#hash',
  'mailto:test@example.com',
  'tel:+1234567890',
  'http://localhost:3000',
  'ftp://files.example.com'
];

describe('JsxRenderer XSS: attribute URI scheme validation', () => {
  it('should render a safe href value unchanged', async () => {
    const jsx = <a href="https://example.com">safe link</a>;
    const result = await JsxRenderer.RenderJsx(jsx);
    expect(result).toEqual('<a href="https://example.com">safe link</a>');
  });

  it('should render a relative href value unchanged', async () => {
    const jsx = <a href="/relative/path">relative link</a>;
    const result = await JsxRenderer.RenderJsx(jsx);
    expect(result).toEqual('<a href="/relative/path">relative link</a>');
  });

  it('should render a hash href value unchanged', async () => {
    const jsx = <a href="#section">hash link</a>;
    const result = await JsxRenderer.RenderJsx(jsx);
    expect(result).toEqual('<a href="#section">hash link</a>');
  });

  for (const safeUri of safeUriValues) {
    it(`should allow safe URI: "${safeUri}"`, async () => {
      const jsx = <a href={safeUri}>link</a>;
      const result = await JsxRenderer.RenderJsx(jsx);
      expect(result).toContain(`href="${safeUri}"`);
    });
  }

  for (const dangerousUri of dangerousUriSchemes) {
    it(`should neutralize dangerous URI scheme: "${dangerousUri}"`, async () => {
      const jsx = <a href={dangerousUri}>malicious link</a>;
      const result = await JsxRenderer.RenderJsx(jsx);
      expect(result).not.toContain(dangerousUri);
    });
  }

  it('should neutralize javascript: protocol on form action', async () => {
    const jsx = <form action="javascript:alert(1)"></form>;
    const result = await JsxRenderer.RenderJsx(jsx);
    expect(result).not.toContain('javascript:');
  });

  it('should neutralize javascript: protocol on button formaction', async () => {
    const jsx = <button formaction="javascript:alert(1)">submit</button>;
    const result = await JsxRenderer.RenderJsx(jsx);
    expect(result).not.toContain('javascript:');
  });

  it('should neutralize dangerous src values', async () => {
    const jsx = <iframe src="javascript:alert(1)"></iframe>;
    const result = await JsxRenderer.RenderJsx(jsx);
    expect(result).not.toContain('javascript:');
  });

  /**
   * @todo: evaluate further
   */
  it.skip('should neutralize dangerous srcdoc values', async () => {
    const jsx = <iframe srcdoc="<script>alert(1)</script>"></iframe>;
    const result = await JsxRenderer.RenderJsx(jsx);
    expect(result).not.toContain('<script>');
  });

  it('should not alter safe attribute values on the same element as dangerous ones', async () => {
    const jsx = <a id="my-link" class="nav-item" href="javascript:alert(1)">link</a>;
    const result = await JsxRenderer.RenderJsx(jsx);
    expect(result).toContain('id="my-link"');
    expect(result).toContain('class="nav-item"');
    expect(result).not.toContain('javascript:');
  });

  it('should neutralize dangerous URIs on object data attribute', async () => {
    const jsx = <object data="javascript:alert(1)"></object>;
    const result = await JsxRenderer.RenderJsx(jsx);
    expect(result).not.toContain('javascript:');
  });

  it('should neutralize dangerous URIs on embed src attribute', async () => {
    const jsx = <embed src="javascript:alert(1)" />;
    const result = await JsxRenderer.RenderJsx(jsx);
    expect(result).not.toContain('javascript:');
  });
});
