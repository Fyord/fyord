import { Guid } from 'tsbase/Functions/Guid';
import { Component } from '../component';
import { State } from './state';

export function DataBind(target: Component, key: string) {
  // @ts-ignore
  const component = this as Component;
  const id = Guid.NewGuid();
  const element = () => document.getElementById(id) as HTMLInputElement;
  const stateKey = `databind-${key}`;

  State(component, stateKey);

  const getter = function () {
    const el = element();
    const stateKeyBoundKey = `${stateKey}-bound`;

    if (el && !component[stateKeyBoundKey]) {
      component[stateKey];
      component[stateKeyBoundKey] = true;

      el.addEventListener('input', () => {
        component[stateKey] = el.value;
      });
    }

    return el?.value || id;
  };

  const setter = function (newValue) {
    element().value = newValue;
    component[stateKey] = newValue;
  };

  Object.defineProperty(target, key, {
    get: getter,
    set: setter
  });
}
