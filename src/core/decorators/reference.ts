import { Component } from '../component';

export function Reference(target: Component, key: string) {
  const id = `${key}-${target.Id}`;
  const element = () => document.querySelector(`[ref='${id}']`) as HTMLElement;

  const getter = function () {
    return element() || id;
  };

  Object.defineProperty(target, key, {
    get: getter
  });
}
