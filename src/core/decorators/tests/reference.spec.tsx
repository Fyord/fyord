import { Jsx, Fragment, JsxRenderer, ParseJsx } from '../../jsx';
import { TestHelpers } from '../../../utilities/testHelpers';
import { Component } from '../../component';
import { Route } from '../../services/module';
import { Reference } from '../reference';
import { Strings } from 'tsbase/Functions/Strings';

class TestComponent extends Component {
  @Reference public ParagraphRef!: HTMLParagraphElement;
  @Reference public InputRef!: HTMLInputElement;

  public Template: (route?: Route) => Promise<Jsx> = async () => <>
    <p id={this.ParagraphRef}>test</p>
    <input id={this.InputRef} type="text"></input>
  </>;
}

describe('Storage Decorators', () => {
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
    document.body.innerHTML = JsxRenderer.RenderJsx(<>{await testComponent.Render()}</>);

    const paragraphHasInnerText = await TestHelpers.TimeLapsedCondition(() => {
      return testComponent.ParagraphRef.innerHTML === 'test';
    });
    expect(paragraphHasInnerText).toBeTruthy();
  });

  it('should support the ability to get and set input values', async () => {
    const value = 'test value';
    document.body.innerHTML = JsxRenderer.RenderJsx(<>{await testComponent.Render()}</>);

    const inputHasSetValue = await TestHelpers.TimeLapsedCondition(() => {
      testComponent.InputRef.value = value;
      return testComponent.InputRef.value === value;
    });
    expect(inputHasSetValue).toBeTruthy();
  });
});
