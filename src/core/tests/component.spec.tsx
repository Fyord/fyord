/* eslint-disable max-lines */
import { Mock } from 'tsmockit';
import { Strings } from 'tsbase/Functions/Strings';
import { Observable } from 'tsbase/Patterns/Observable/Observable';
import { IEventStore } from 'tsbase/Patterns/EventStore/IEventStore';
import { ParseJsx } from '../jsx';
import { Component } from '../component';
import { App } from '../app';
import { EventTypes } from '../eventTypes';
import { IRouter, Route } from '../services/module';
import { TestHelpers } from '../../utilities/testHelpers';
import { EventStore } from 'tsbase/Patterns/EventStore/EventStore';

class FakeComponent extends Component {
  ReRender = async () => this.reRender();
  UseAppStore = async (path: string) => this.useAppStore(path);
  UseState = async (path: string, initialState: any) => this.useState(path, initialState);
  AddEventListenerToId = (id: string, eventType: EventTypes, func: (event: Event | null) => any) => this.addEventListenerToId(
    id, eventType, func);
  UserInput = (text: string, allowHtml?: boolean) => this.userInput(text, allowHtml);
  GetInputValue = (inputId: string, allowHtml?: boolean) => this.getInputValue(inputId, allowHtml);
  SetState = (state: IEventStore<any>) => this.state = state as EventStore<any>;
  SetStateAt = (value: any, path: string) => this.state.SetStateAt(value, path);
}

class JsxComponent extends Component {
  Html = async () => <p>test</p>;
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
    mockApp.Setup(a => a.Router, mockRouter.Object);
    mockApp.Setup(a => a.Store, mockEventStore.Object);
    mockEventStore.Setup(s => s.ObservableAt(Strings.Empty), fakeStateObservable);
    mockEventStore.Setup(s => s.GetStateAt(Strings.Empty), Strings.Empty);
    mockEventStore.Setup(s => s.SetStateAt(Strings.Empty, Strings.Empty));

    mockComponentState.Setup(s => s.ObservableAt(Strings.Empty), fakeComponentStateObservable);
    mockComponentState.Setup(s => s.GetStateAt(Strings.Empty), Strings.Empty);
    mockComponentState.Setup(s => s.SetStateAt(Strings.Empty, Strings.Empty));

    classUnderTest = new FakeComponent(true, mockDocument.Object, mockApp.Object);
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

  it('should run default (void) behavior after rendering if component is in the dom', async () => {
    const fakeDiv = document.createElement('div');
    classUnderTest = new FakeComponent(true, mockDocument.Object, mockApp.Object);
    mockDocument.Setup(d => d.getElementById(classUnderTest.Id), fakeDiv);

    fakeRoute.Publish();
    await classUnderTest.Render();

    const renderedComponentQueried = await TestHelpers.TimeLapsedCondition(() =>
      mockDocument.TimesMemberCalled(d => d.getElementById(classUnderTest.Id)) >= 1);
    expect(renderedComponentQueried).toBeTruthy();
  });

  it('should cancel route subscription if component is not rendered', async () => {
    classUnderTest = new FakeComponent(true, mockDocument.Object, mockApp.Object);
    mockDocument.Setup(d => d.getElementById(classUnderTest.Id), null);

    fakeRoute.Publish();
    await classUnderTest.Render();

    const renderedComponentQueried = await TestHelpers.TimeLapsedCondition(() =>
      mockDocument.TimesMemberCalled(d => d.getElementById(classUnderTest.Id)) >= 1);
    expect(renderedComponentQueried).toBeTruthy();
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

  it('should use the app store to get the current state and trigger re renders on state change', async () => {
    const path = 'test';
    const value = 'value';
    mockEventStore.Setup(s => s.GetStateAt(path), value);

    App.Instance().Store.SetStateAt(value, path);
    const state = await classUnderTest.UseAppStore(path);
    expect(state()).toEqual(value);
    fakeStateObservable.Publish('new value');

    expect(state()).toEqual(value);
    mockEventStore.Verify(s => s.GetStateAt(path), 2);
  });

  it('should use the component store to get the current state and trigger re renders on state change', async () => {
    const path = 'test';
    const value = 'value';
    mockComponentState.Setup(s => s.GetStateAt(path), value);

    const state = await classUnderTest.UseState(path, value);
    expect(state()).toEqual(value);
    state('new value');

    expect(state()).toEqual(value);
    mockComponentState.Verify(s => s.GetStateAt(path), 3);
  });

  it('should add an event listener to an element with the given id', () => {
    const fakeButton = document.createElement('button');
    mockDocument.Setup(d => d.getElementById(''), fakeButton);

    const result = classUnderTest.AddEventListenerToId('', EventTypes.Click, () => null);

    expect(result.IsSuccess).toBeTruthy();
  });

  it('should sanitize given user input without html allowed', () => {
    const attackString = '<img src="fake" onerror="alert(1)">';
    expect(classUnderTest.UserInput(attackString)).toEqual(Strings.Empty);
  });

  it('should sanitize given user input with html allowed', () => {
    const attackString = '<img src="fake" onerror="alert(1)">';
    const expected = '<img src>';
    expect(classUnderTest.UserInput(attackString, true)).toEqual(expected);
  });

  it('should get input value and sanitize without html allowed', () => {
    const attackString = '<img src="fake" onerror="alert(1)">';
    const fakeInput = document.createElement('input');
    fakeInput.value = attackString;
    mockDocument.Setup(d => d.getElementById(''), fakeInput);

    expect(classUnderTest.GetInputValue('')).toEqual(Strings.Empty);
  });

  it('should get input value and sanitize with html allowed', () => {
    const attackString = '<img src="fake" onerror="alert(1)">';
    const fakeInput = document.createElement('input');
    fakeInput.value = attackString;
    mockDocument.Setup(d => d.getElementById(''), fakeInput);
    const expected = '<img src>';

    expect(classUnderTest.GetInputValue('', true)).toEqual(expected);
  });

  it('should return an empty string for input value when input does not exist', () => {
    mockDocument.Setup(d => d.getElementById(''), null);
    expect(classUnderTest.GetInputValue('', true)).toEqual(Strings.Empty);
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
});
