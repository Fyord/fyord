/**
 * @jest-environment jsdom
 */
import { Component } from '../component';
import { JsxRenderer, ParseJsx, Fragment, Jsx } from '../jsx';
import { TestHelpers } from '../../utilities/testHelpers';
import { Strings } from 'tsbase/System/Strings';

describe('JsxRenderer', () => {
  it('should return the outer html of a parsed jsx node with only inner text', async () => {
    const jsxToParse = <div>test</div>;
    const expectedOuterHtml = '<div>test</div>';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should return the outer html of a parsed jsx node with a nested node', async () => {
    const jsxToParse = <div><p>test</p></div>;
    const expectedOuterHtml = '<div><p>test</p></div>';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should return the outer html of a parsed jsx node with a nested component', async () => {
    class TestComponent extends Component {
      Template = async () => <>test</>;
    }
    const jsxToParse = <div>{await new TestComponent().Render()}</div>;
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toContain('<div id="fy-');
  });

  it('should return the neutralized outer html of a parsed jsx node with nested string mimicking a component', async () => {
    const jsxToParse = <div>{'<div id="fy-"></div><img src="fake" onerror="alert(1)">'}</div>;
    const expectedOuterHtml = '<div>&lt;div id="fy-"&gt;&lt;/div&gt;&lt;img src="fake" onerror="alert(1)"&gt;</div>';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toContain(expectedOuterHtml);
  });

  it('should set attributes defined in jsx', async () => {
    const jsxToParse = <div class="test"><p>test</p></div>;
    const expectedOuterHtml = '<div class="test"><p>test</p></div>';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should return jsx when a child is undefined', async () => {
    const undefinedVariable = undefined;
    const jsxToParse = <div>{undefinedVariable}</div>;
    const expectedOuterHtml = '<div></div>';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should add event listeners to bound events', async () => {
    let testVariable = 0;
    const jsxToParse = <button id="test-id" onclick={() => testVariable = 1}></button>;
    const renderedHtml = await JsxRenderer.RenderJsx(jsxToParse);
    document.body.innerHTML = renderedHtml;

    expect(renderedHtml).toEqual('<button id="test-id"></button>');
    await TestHelpers.Expect(
      () => {
        document.getElementById('test-id')?.click();
        return testVariable === 1;
      },
      (m) => m.toBeTruthy());
  });

  it('should not attempt to add event listeners if bind element is deleted', async () => {
    document.body.innerHTML = Strings.Empty;
    const jsxToParse = <button id="test-id" onclick={() => null}></button>;

    await JsxRenderer.RenderJsx(jsxToParse);

    await TestHelpers.Expect(
      () => document.getElementById('test-id') === null ? null : false,
      (m) => m.toBeNull());
  });

  it('should add guid ids for bound events if none are given', async () => {
    const jsxToParse = <button onclick={() => true}></button>;
    const renderedHtml = await JsxRenderer.RenderJsx(jsxToParse);
    expect(renderedHtml.startsWith('<button id=')).toBeTruthy();
  });

  it('should parse jsx containing fragments', async () => {
    const jsxToParse = <><p>test</p><p><><span>test</span></></p></>;
    const expectedOuterHtml = '<p>test</p><p><span>test</span></p>';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should parse jsx and render the text false', async () => {
    const jsxToParse = <>false</>;
    const expectedOuterHtml = 'false';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should parse jsx and NOT render the boolean value false', async () => {
    const jsxToParse = <>{false}</>;
    const expectedOuterHtml = '';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should parse jsx and render the right side of the && operator when the predicate is true', async () => {
    const jsxToParse = <>{true && 'test'}</>;
    const expectedOuterHtml = 'test';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should parse jsx and NOT render "false" when the && operator is used with a falsy predicate', async () => {
    const jsxToParse = <>{false && 'test'}</>;
    const expectedOuterHtml = '';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should parse jsx for fyord component that has no props to children', async () => {
    class TestComponent extends Component {
      constructor() {
        super();
      }
      Template = async () => <>
        <h1>Test</h1>
      </>;
    }

    const jsxToParse = <>{await (<TestComponent />)}</>;
    const expectedOuterHtml = '<h1>Test</h1>';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toContain(expectedOuterHtml);
  });

  it('should parse jsx for fyord component using the first param as properties and the second param as children', async () => {
    class TestComponent extends Component {
      constructor(
        private props = { title: 'default' },
        private children: Jsx
      ) {
        super();
      }
      Template = async () => <>
        <h1>{this.props.title}</h1>
        {this.children}
      </>;
    }

    const jsxToParse = <>{await (<TestComponent title='test'>test</TestComponent>)}</>;
    const expectedOuterHtml = '<h1>test</h1>test';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toContain(expectedOuterHtml);
  });

  it('should render an attribute with the string value "false"', async () => {
    const jsxToParse = <input type="checkbox" data-attr={'false'} />;
    const expectedOuterHtml = '<input type="checkbox" data-attr="false">';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });

  it('should not render an attribute with the boolean value false', async () => {
    const jsxToParse = <input type="checkbox" checked={false} />;
    const expectedOuterHtml = '<input type="checkbox">';
    expect(await JsxRenderer.RenderJsx(jsxToParse)).toEqual(expectedOuterHtml);
  });
});
