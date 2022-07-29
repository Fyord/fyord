/**
 * @jest-environment jsdom
 */

import { Strings } from 'tsbase/System/Strings';
import { Jsx, Fragment, JsxRenderer, ParseJsx } from '../../jsx';
import { TestHelpers } from '../../../utilities/testHelpers';
import { Component } from '../../component';
import { Route } from '../../services/module';
import { Reference } from '../reference';

class TestComponent extends Component {
  @Reference public ParagraphRef!: HTMLParagraphElement;
  @Reference public InputRef!: HTMLInputElement;

  public Template: (route?: Route) => Promise<Jsx> = async () => <>
    <p ref={this.ParagraphRef}>test</p>
    <input ref={this.InputRef} type="text"></input>
  </>;
}

describe('Reference Decorator', () => {
  let testComponent: TestComponent;

  beforeEach(() => {
    document.body.innerHTML = Strings.Empty;
    testComponent = new TestComponent();
  });

  it('should return an id if no element has had it assigned', () => {
    expect(typeof testComponent.ParagraphRef).toEqual('string');
    expect(testComponent.ParagraphRef).toBeTruthy();
  });

  it('should hold a reference to an element in the template', async () => {
    document.body.innerHTML = await JsxRenderer.RenderJsx(<>{await testComponent.Render()}</>);

    await TestHelpers.Expect(
      () => testComponent.ParagraphRef.innerHTML === 'test' ? testComponent.ParagraphRef.innerHTML : null,
      (m) => m.toEqual('test'));
  });

  it('should support the ability to get and set input values', async () => {
    const value = 'test value';
    document.body.innerHTML = await JsxRenderer.RenderJsx(<>{await testComponent.Render()}</>);
    expect(testComponent.InputRef.value).toEqual(Strings.Empty);

    testComponent.InputRef.value = value;

    await TestHelpers.Expect(
      () => testComponent.InputRef.value === value ? testComponent.InputRef.value : null,
      (m) => m.toEqual(value));
  });
});
