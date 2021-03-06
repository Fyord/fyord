import { Component } from '../component';
import { JsxRenderer, ParseJsx, Fragment } from '../jsx';
import { TestHelpers } from '../../utilities/testHelpers';
import { Strings } from 'tsbase/Functions/Strings';

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
      Template = async () => <>test</>;
    }
    const jsxToParse = <div>{await new TestComponent().Render()}</div>;
    expect(JsxRenderer.RenderJsx(jsxToParse)).toContain('<div id="fy-');
  });

  it('should return the neutralized outer html of a parsed jsx node with nested string mimicking a component', async () => {
    const jsxToParse = <div>{'<div id="fy-"></div><img src="fake" onerror="alert(1)">'}</div>;
    const expectedOuterHtml = '<div>&lt;div id="fy-"&gt;&lt;/div&gt;&lt;img src="fake" onerror="alert(1)"&gt;</div>';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toContain(expectedOuterHtml);
  });

  it('should set attributes defined in jsx', () => {
    const jsxToParse = <div class="test"><p>test</p></div>;
    const expectedOuterHtml = '<div class="test"><p>test</p></div>';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should return jsx when a child is undefined', () => {
    const undefinedVariable = undefined;
    const jsxToParse = <div>{undefinedVariable}</div>;
    const expectedOuterHtml = '<div></div>';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should add event listeners to bound events', async () => {
    let testVariable = 0;
    const jsxToParse = <button id="test-id" onclick={() => testVariable = 1}></button>;
    const renderedHtml = JsxRenderer.RenderJsx(jsxToParse);
    document.body.innerHTML = renderedHtml;

    const eventProperlyBound = await TestHelpers.TimeLapsedCondition(() => {
      document.getElementById('test-id')?.click();
      return testVariable === 1;
    });

    expect(renderedHtml).toEqual('<button id="test-id"></button>');
    expect(eventProperlyBound).toBeTruthy();
  });

  it('should not attempt to add event listeners if bind element is deleted', async () => {
    document.body.innerHTML = Strings.Empty;
    const jsxToParse = <button id="test-id" onclick={() => null}></button>;

    JsxRenderer.RenderJsx(jsxToParse);

    await TestHelpers.TimeLapsedCondition(() => {
      return expect(document.getElementById('test-id')).toBeNull();
    });
  });

  it('should add guid ids for bound events if none are given', () => {
    const jsxToParse = <button onclick={() => true}></button>;
    const renderedHtml = JsxRenderer.RenderJsx(jsxToParse);
    expect(renderedHtml.startsWith('<button id=')).toBeTruthy();
  });

  it('should parse jsx containing fragments', () => {
    const jsxToParse = <><p>test</p><p><><span>test</span></></p></>;
    const expectedOuterHtml = '<p>test</p><p><span>test</span></p>';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should parse jsx and render the text false', () => {
    const jsxToParse = <>false</>;
    const expectedOuterHtml = 'false';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should parse jsx and NOT render the boolean value false', () => {
    const jsxToParse = <>{false}</>;
    const expectedOuterHtml = '';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should parse jsx and render the right side of the && operator when the predicate is true', () => {
    const jsxToParse = <>{true && 'test'}</>;
    const expectedOuterHtml = 'test';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should parse jsx and NOT render "false" when the && operator is used with a falsy predicate', () => {
    const jsxToParse = <>{false && 'test'}</>;
    const expectedOuterHtml = '';
    expect(JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });
});
