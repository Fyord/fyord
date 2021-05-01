// intentionally not included in ./module

import { Command } from 'tsbase/Patterns/CommandQuery/Command';
import { Result } from 'tsbase/Patterns/Result/Result';

export function RecursiveReRender(oldElement: Element, newElement: Element): Result {
  return new Command(() => {
    const contentHasChanged = newElement.innerHTML !== oldElement.innerHTML;

    if (contentHasChanged) {
      const shouldConsiderChildren = newElement.children.length > 0 && oldElement.children.length === newElement.children.length;

      if (shouldConsiderChildren) {
        for (let index = 0; index < newElement.children.length; index++) {
          // eslint-disable-next-line no-use-before-define
          updateChildrenWhenCompatible(oldElement, newElement, index);
        }
      } else {
        oldElement.innerHTML = newElement.innerHTML;
      }
    }
  }).Execute();
}

function updateChildrenWhenCompatible(oldElement: Element, newElement: Element, index: number) {
  const oldChild = oldElement.children[index];
  const newChild = newElement.children[index];

  const childrenCompatible = oldChild && newChild && oldChild.tagName === newChild.tagName;

  if (childrenCompatible) {
    RecursiveReRender(oldChild, newChild);
  } else {
    oldElement.innerHTML = newElement.innerHTML;
  }
}
