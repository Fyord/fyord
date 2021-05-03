// intentionally not included in ./module
/* eslint-disable no-use-before-define */

import { Command } from 'tsbase/Patterns/CommandQuery/Command';
import { Result } from 'tsbase/Patterns/Result/Result';

const noChangeAttributes = ['id', 'value'];

export function RecursiveReRender(oldElement: Element, newElement: Element): Result {
  return new Command(() => {
    const contentHasChanged = newElement.outerHTML !== oldElement.outerHTML;

    if (contentHasChanged) {
      const shouldConsiderChildren = newElement.children.length > 0 && oldElement.children.length === newElement.children.length;

      if (shouldConsiderChildren) {
        for (let index = 0; index < newElement.children.length; index++) {
          updateChildrenWhenCompatible(oldElement, newElement, index);
        }
      } else {
        updateElement(oldElement, newElement);
      }
    }
  }).Execute();
}

function updateChildrenWhenCompatible(oldElement: Element, newElement: Element, index: number): void {
  const oldChild = oldElement.children[index];
  const newChild = newElement.children[index];

  const childrenCompatible = oldChild && newChild && oldChild.tagName === newChild.tagName;

  if (childrenCompatible) {
    updateAttributes(oldElement, newElement);
    removeDeletedAttributes(oldElement, newElement);
    RecursiveReRender(oldChild, newChild);
  } else {
    updateElement(oldElement, newElement);
  }
}

function updateElement(oldElement: Element, newElement: Element): void {
  oldElement.innerHTML = newElement.innerHTML;
  updateAttributes(oldElement, newElement);
  removeDeletedAttributes(oldElement, newElement);
}

function updateAttributes(oldElement: Element, newElement: Element): void {
  Array.from(newElement.attributes).filter(a => !noChangeAttributes.includes(a.name)).forEach(newAttribute => {
    oldElement.setAttribute(newAttribute.name, newAttribute.value);
  });
}

function removeDeletedAttributes(oldElement: Element, newElement: Element): void {
  Array.from(oldElement.attributes).filter(
    a => !noChangeAttributes.includes(a.name) &&
      !newElement.hasAttribute(a.name))
    .forEach(removedAttribute => oldElement.removeAttribute(removedAttribute.name));
}
