import { IGenericStorage } from 'tsbase/Persistence/GenericStorage/IGenericStorage';
import { DomStorage, DomStorageMode } from 'tsbase/Persistence/GenericStorage/DomStorage';
import { Component } from '../component';
import { Result } from 'tsbase/Patterns/Result/Result';

class EmbeddedStorage implements IGenericStorage {
  // #region intentionally not implemented
  Get<T>(): Result<T | null> { throw new Error(); }
  Set(): Result<null> { throw new Error(); }
  Remove(): Result<null> { throw new Error(); }
  // #endregion
  GetValue(key: string): Result<string | null> {
    return new Result(document.getElementById(key)?.innerHTML);
  }
  SetValue(key: string, value: any): Result<null> {
    const existingScriptTag = document.getElementById(key) as HTMLScriptElement;
    if (existingScriptTag) {
      existingScriptTag.innerHTML = value;
    } else {
      const newScriptTag = document.createElement('script');
      newScriptTag.id = key;
      newScriptTag.type = 'application/json';
      newScriptTag.innerHTML = value;
      document.body.appendChild(newScriptTag);
    }
    return new Result();
  }
}

enum StorageModes {
  Session = DomStorageMode.Session,
  Local = DomStorageMode.Local,
  Embedded = 2
}

const storageTypePostfix = '_storage_type';

function definePropertyForStorage(target: Component, key: string, type: StorageModes) {
  const storage = type === StorageModes.Embedded ?
    new EmbeddedStorage() :
    new DomStorage(type as unknown as DomStorageMode);

  const getter = function () {
    const valueType = storage.GetValue(`${key}${storageTypePostfix}`).Value;
    const value = storage.GetValue(key).Value;

    if (valueType === 'string') {
      return value;
    } else {
      try {
        return JSON.parse(value as any);
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
  definePropertyForStorage(target, key, StorageModes.Session);
}

export function Local(target: Component, key: string) {
  definePropertyForStorage(target, key, StorageModes.Local);
}

export function Embedded(target: Component, key: string) {
  definePropertyForStorage(target, key, StorageModes.Embedded);
}
