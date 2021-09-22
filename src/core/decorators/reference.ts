import { Guid } from 'tsbase/Functions/Guid';
import { Component } from '../component';

function definePropertyForReference(target: Component, key: string, id: string) {
  const element = () => document.getElementById(id) as HTMLElement;

  const getter = function () {
    return element() || id;
  };

  Object.defineProperty(target, key, {
    get: getter
  });
}

export function Reference(target: Component, key: string) {
  definePropertyForReference(target, key, Guid.NewGuid());
}
