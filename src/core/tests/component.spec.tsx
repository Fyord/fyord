/* eslint-disable max-lines */
import { Mock } from 'tsmockit';
import { Strings } from 'tsbase/Functions/Strings';
import { Observable } from 'tsbase/Patterns/Observable/Observable';
import { IEventStore } from 'tsbase/Patterns/EventStore/IEventStore';
import { ParseJsx, Fragment } from '../jsx';
import { Component } from '../component';
import { App } from '../app';
import { IRouter, Route } from '../services/module';
import { EventStore } from 'tsbase/Patterns/EventStore/EventStore';
import { Asap } from '../../utilities/asap';
import { TestHelpers } from '../../utilities/testHelpers';

class FakeComponent extends Component {
  public DisconnectedCalled = false;
  public Template = async () => <></>;
  SetState = (state: IEventStore<any>) => this.State = state as EventStore<any>;
  SetStateAt = (value: any, path: string) => this.State.SetStateAt(value, path);
  Disconnected = () => this.DisconnectedCalled = true;
}

class JsxComponent extends Component {
  Template = async () => <p>test</p>;
}

describe('Component', () => {
  let classUnderTest: FakeComponent;
  const mockDocument = new Mock<Document>();
  const mockEventStore = new Mock<IEventStore<any>>();
  const mockComponentState = new Mock<IEventStore<any>>();
  const mockApp = new Mock<App>();
  const mockRouter = new Mock<IRouter>();
  const fakeRoute = new Observable<Route>();
  const fakeStateObservable = new Observable<string>();
  const fakeComponentStateObservable = new Observable<string>();

  beforeEach(() => {
    mockDocument.Setup(d => d.getElementById(Strings.Empty), null);
    mockRouter.Setup(r => r.Route, fakeRoute);
    mockRouter.Setup(r => r.UseClientRouting());
    mockApp.Setup(a => a.Router, mockRouter.Object);
    mockApp.Setup(a => a.Store, mockEventStore.Object);
    mockEventStore.Setup(s => s.ObservableAt(Strings.Empty), fakeStateObservable);
    mockEventStore.Setup(s => s.GetStateAt(Strings.Empty), Strings.Empty);
    mockEventStore.Setup(s => s.SetStateAt(Strings.Empty, Strings.Empty));

    mockComponentState.Setup(s => s.ObservableAt(Strings.Empty), fakeComponentStateObservable);
    mockComponentState.Setup(s => s.GetStateAt(Strings.Empty), Strings.Empty);
    mockComponentState.Setup(s => s.SetStateAt(Strings.Empty, Strings.Empty));

    classUnderTest = new FakeComponent(mockDocument.Object, mockApp.Object);
    classUnderTest.SetState(mockComponentState.Object);
  });

  it('should construct', () => {
    expect(classUnderTest).toBeDefined();
  });

  it('should construct with default parameters', () => {
    expect(new FakeComponent()).toBeDefined();
  });

  it('should return a unique id based on the given key', () => {
    const key = 'test';
    const expected = classUnderTest.Ids(key);
    expect(classUnderTest.Ids(key)).toEqual(expected);
  });

  it('should render with wrapper', async () => {
    const output = await classUnderTest.Render();
    expect(output.startsWith(`<div id="${classUnderTest.Id}"`)).toBeTruthy();
  });

  it('should render when using jsx', async () => {
    const jsxComponent = new JsxComponent();
    const output = await jsxComponent.Render();
    expect(output).toContain('<p>test</p>');
  });

  it('should render without wrapper', async () => {
    const output = await classUnderTest.Render(undefined, false);
    expect(output).toEqual(Strings.Empty);
  });

  it('should re-render the contents of the component when it is rendered', async () => {
    const fakeDiv = document.createElement('div');
    mockDocument.Setup(d => d.getElementById(classUnderTest.Id), fakeDiv);

    await classUnderTest.ReRender();

    expect(fakeDiv.innerHTML).toEqual(Strings.Empty);
  });

  it('should not re-render the contents of the component when it is not rendered', async () => {
    mockDocument.Setup(d => d.getElementById(classUnderTest.Id), null);
    await classUnderTest.ReRender();
  });

  it('should return its own rendered element', () => {
    const fakeElement = document.createElement('div');
    mockDocument.Setup(d => d.getElementById(classUnderTest.Id), fakeElement);
    expect(classUnderTest.Element).toBeDefined();
  });

  it('should return null for element when it is not rendered', () => {
    mockDocument.Setup(d => d.getElementById(classUnderTest.Id), null);
    expect(classUnderTest.Element).toBeNull();
  });

  it('should return null as default behavior for disconnected', () => {
    expect(new JsxComponent()['Disconnected']()).toBeFalsy();
  });

  it('should observe mutations on parent element and call disconnected when element no longer exists in the dom', async () => {
    classUnderTest = new FakeComponent();
    document.body.innerHTML = await classUnderTest.Render();

    Asap(() => {
      classUnderTest.Element?.remove();
    });

    const disconnectedCalled = await TestHelpers.TimeLapsedCondition(() => {
      return classUnderTest.DisconnectedCalled; // assertions proving expected behavior was met
    });
    expect(disconnectedCalled).toBeTruthy();
  });

  it('should observe mutations on parent element BUT NOT call disconnected when the component is still in the dom', async () => {
    classUnderTest = new FakeComponent();
    document.body.innerHTML = await classUnderTest.Render();

    Asap(() => {
      const newDiv = document.createElement('div');
      classUnderTest.Element?.parentElement?.appendChild(newDiv);
    });

    const disconnectedCalled = await TestHelpers.TimeLapsedCondition(() => {
      return classUnderTest.DisconnectedCalled; // assertions proving expected behavior was met
    });
    expect(disconnectedCalled).toBeFalsy();
  });
});
