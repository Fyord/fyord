import { Guid } from 'tsbase/Functions/Guid';
import { Component } from '../component';

export function Reference(target: Component, key: string) {
  const id = Guid.NewGuid();

  const element = () => document.getElementById(id) as HTMLElement;

  const getter = function () {
    return element() || id;
  };

  Object.defineProperty(target, key, {
    get: getter
  });
}
