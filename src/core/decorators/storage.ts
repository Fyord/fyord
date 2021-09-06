import { DomStorageInterface, DomStorageMode } from 'tsbase/Persistence/GenericStorageInterfaces/DomStorageInterface';
import { Component } from '../component';

function definePropertyForStateInStore(target: Component, key: string, type: DomStorageMode) {
  const storage = new DomStorageInterface(type);

  const getter = function () {
    const rawValue = storage.GetValue(key);
    if (
      rawValue.IsSuccess &&
      typeof rawValue.Value === 'string' &&
      (
        rawValue.Value.startsWith('{') ||
        rawValue.Value.startsWith('[') ||
        !isNaN(parseFloat(rawValue.Value))
      )
    ) {
      return JSON.parse(rawValue.Value);
    } else {
      return rawValue.Value;
    }
  };

  const setter = function (newValue) {
    const valueToStore = typeof newValue === 'object' ?
      JSON.stringify(newValue) : newValue;

    storage.SetValue(key, valueToStore);
  };

  Object.defineProperty(target, key, {
    get: getter,
    set: setter
  });
}

export function Session(target: Component, key: string) {
  definePropertyForStateInStore(target, key, DomStorageMode.Session);
}

export function Local(target: Component, key: string) {
  definePropertyForStateInStore(target, key, DomStorageMode.Local);
}
