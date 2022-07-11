import { Component } from '../component';

export function Reference(target: Component, key: string) {
  const getter = function () {
    // @ts-ignore
    const id = `${key}-${(this as Component).Id}`;
    return document.querySelector(`[ref='${id}']`) as HTMLElement || id;
  };

  Object.defineProperty(target, key, {
    get: getter
  });
}
