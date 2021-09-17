import { DomStorageInterface, DomStorageMode } from 'tsbase/Persistence/GenericStorageInterfaces/DomStorageInterface';
import { Component } from '../component';

function definePropertyForStateInStore(target: Component, key: string, type: DomStorageMode) {
  const storage = new DomStorageInterface(type);

  const getter = function () {
    const result = storage.GetValue(key);
    if (
      result.IsSuccess &&
      typeof result.Value === 'string' &&
      (
        result.Value.startsWith('{') ||
        result.Value.startsWith('[') ||
        !isNaN(parseFloat(result.Value))
      )
    ) {
      return JSON.parse(result.Value);
    } else {
      return result.Value;
    }
  };

  const setter = function (newValue) {
    const valueToStore = typeof newValue !== 'string' ?
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
