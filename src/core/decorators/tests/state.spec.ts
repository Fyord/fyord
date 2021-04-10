import { App } from '../../app';
import { Component } from '../../component';
import { State, AppStore } from '../state';

export class TestComponent extends Component {
  @State public StateTest = 0;
  @AppStore public AppStoreTest?: number;
}

describe('State Decorators', () => {
  const testComponent = new TestComponent();

  it('should get properties', () => {
    testComponent.AppStoreTest = 0;

    expect(testComponent.StateTest).toEqual(0);
    expect(testComponent.AppStoreTest).toEqual(0);
  });

  it('should set properties', () => {
    testComponent.AppStoreTest = 1;
    testComponent.StateTest = 1;

    expect(testComponent.StateTest).toEqual(1);
    expect(testComponent.AppStoreTest).toEqual(1);
  });

  it('should not add additional app store subscribers once one is set', () => {
    testComponent.AppStoreTest;
    testComponent.AppStoreTest;

    expect(
      App.Instance().Store['stateObservers'].get('AppStoreTest').subscribers.size)
      .toEqual(1);
  });

  it('should not add additional state subscribers once one is set', () => {
    testComponent.StateTest;
    testComponent.StateTest;

    expect(
      testComponent.State['stateObservers'].get('StateTest').subscribers.size)
      .toEqual(1);
  });
});
