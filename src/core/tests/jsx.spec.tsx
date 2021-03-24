import { Component } from '../component';
import { JsxRenderer, ParseJsx } from '../jsx';

describe('JsxRenderer', () => {
  it('should return the outer html of a parsed jsx node with only inner text', () => {
    const jsxToParse = <div>test</div>;
    const expectedOuterHtml = '<div>test</div>';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should return the outer html of a parsed jsx node with a nested node', () => {
    const jsxToParse = <div><p>test</p></div>;
    const expectedOuterHtml = '<div><p>test</p></div>';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should return the outer html of a parsed jsx node with a nested component', async () => {
    class TestComponent extends Component {
      Html = async () => 'test';
    }
    const jsxToParse = <div>{await new TestComponent().Render()}</div>;
    expect(JsxRenderer.RenderJsx(jsxToParse)).toContain('<div id="fj-');
  });

  it('should return the neutralized outer html of a parsed jsx node with nested string mimicking a component', async () => {
    const jsxToParse = <div>{'<div id="fj-"></div><img src="fake" onerror="alert(1)">'}</div>;
    const expectedOuterHtml = '<div>&lt;div id="fj-"&gt;&lt;/div&gt;&lt;img src="fake" onerror="alert(1)"&gt;</div>';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toContain(expectedOuterHtml);
  });
});
