import { Jsx, Fragment, JsxRenderer, ParseJsx } from '../../jsx';
import { Component } from '../../component';
import { Route } from '../../services/module';
import { DataBind } from '../databind';
import { Strings } from 'tsbase/Functions/Strings';

class TestComponent extends Component {
  @DataBind public BoundInput!: string;

  public Template: (route?: Route) => Promise<Jsx> = async () => <>
    <input id={this.BoundInput} type="text" />
  </>;
}

describe('DataBind Decorator', () => {
  let testComponent: TestComponent;

  beforeEach(() => {
    document.body.innerHTML = Strings.Empty;
    testComponent = new TestComponent();
  });

  it('should return an id if no element has had it assigned', () => {
    expect(typeof testComponent.BoundInput).toEqual('string');
    expect(testComponent.BoundInput).toBeTruthy();
  });


  it('should get and set values for the bound input', async () => {
    document.body.innerHTML = JsxRenderer.RenderJsx(<>{await testComponent.Render()}</>);
    testComponent.BoundInput = 'test';
    expect(testComponent.BoundInput).toEqual('test');
  });

  // it('should update stored values on the input element\'s input event', async () => {
  //   document.body.innerHTML = JsxRenderer.RenderJsx(<>{await testComponent.Render()}</>);
  // });
});
