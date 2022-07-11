import { Guid } from 'tsbase/System/Guid';
import { Component } from '../component';

export function Reference(target: Component, key: string) {
  const id = Guid.NewGuid();
  const element = () => document.querySelector(`[ref='${id}']`) as HTMLElement;

  const getter = function () {
    return element() || id;
  };

  Object.defineProperty(target, key, {
    get: getter
  });
}
