import { DomStorageInterface, DomStorageMode } from 'tsbase/Persistence/GenericStorageInterfaces/DomStorageInterface';
import { Component } from '../component';

const storageTypePostfix = '_storage_type';

function definePropertyForStorage(target: Component, key: string, type: DomStorageMode) {
  const storage = new DomStorageInterface(type);

  const getter = function () {
    const valueType = storage.GetValue(`${key}${storageTypePostfix}`).Value;
    const value = storage.GetValue(key).Value;

    if (valueType === 'string') {
      return value;
    } else {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
  };

  const setter = function (newValue) {
    const storageType = typeof newValue;
    const valueToStore = storageType !== 'string' ?
      JSON.stringify(newValue) : newValue;

    storage.SetValue(`${key}${storageTypePostfix}`, storageType);
    storage.SetValue(key, valueToStore);
  };

  Object.defineProperty(target, key, {
    get: getter,
    set: setter
  });
}

export function Session(target: Component, key: string) {
  definePropertyForStorage(target, key, DomStorageMode.Session);
}

export function Local(target: Component, key: string) {
  definePropertyForStorage(target, key, DomStorageMode.Local);
}
