import { Component } from '../component';

enum StoreType {
  App = 'app',
  Component = 'component'
}

function definePropertyForStateInStore(target: Component, key: string, storeType: StoreType) {
  const getter = function () {
    // @ts-ignore
    const component = this as Component;
    const subKey = `${storeType}-store-${key}`;
    const store = storeType === StoreType.App ? component.App.Store : component.State;

    if (!component[subKey]) {
      const subId = store.ObservableAt(key).Subscribe(() => {
        component.ReRender(component.App.Router.CurrentRoute);
      });
      component[subKey] = subId;
    }

    return store.GetStateAt(key);
  };

  const setter = function (newValue) {
    // @ts-ignore
    const component = this as Component;
    const store = storeType === StoreType.App ? component.App.Store : component.State;
    const currentValue = store.GetStateAt(key);

    if (newValue !== currentValue) {
      store.SetStateAt(newValue, key);
    }
  };

  Object.defineProperty(target, key, {
    get: getter,
    set: setter
  });
}

export function State(target: Component, key: string) {
  definePropertyForStateInStore(target, key, StoreType.Component);
}

export function AppStore(target: Component, key: string) {
  definePropertyForStateInStore(target, key, StoreType.App);
}
