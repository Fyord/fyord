import { Guid } from 'tsbase/Functions/Guid';
import { Command } from 'tsbase/Patterns/CommandQuery/Command';
import { Component } from './component';
import { EventTypes } from './eventTypes';
import { DomEvents } from './domEvents';

export type Jsx = {
  attributes: Record<string, string>,
  children: Jsx[] | string[],
  nodeName: string
};

export function ParseJsx(nodeName, attributes, ...children): Jsx {
  children = [].concat(...children);
  return { nodeName, attributes, children };
}

export class JsxRenderer {
  public static RenderJsx(jsx: Jsx): string {
    return JsxRenderer.transformJsxToHtml(jsx).outerHTML;
  }

  private static addElementEventListener(attribute: string, jsx: Jsx, element: HTMLElement) {
    const event = attribute.split('on')[1] as EventTypes;
    const func = jsx.attributes[attribute] as unknown as (event: Event | null) => any;
    const id = element.attributes['id'] ? element.attributes['id'].nodeValue : Guid.NewGuid();
    element.setAttribute('id', id);

    setTimeout(() => {
      const element = document.getElementById(id) as HTMLElement;
      element.addEventListener(event, func);
    });
  }

  // eslint-disable-next-line complexity
  private static transformJsxToHtml(jsx: Jsx): HTMLElement {
    const dom: HTMLElement = document.createElement(jsx.nodeName);

    for (const key in jsx.attributes) {
      new Command(() => {
        if (DomEvents.includes(key)) {
          this.addElementEventListener(key, jsx, dom);
        } else {
          dom.setAttribute(key, jsx.attributes[key]);
        }
      }).Execute();
    }

    for (const child of jsx.children) {
      if (typeof child === 'string' || JsxRenderer.nodeIsNumberOrBoolean(child)) {
        const childText = child.toString();
        if (childText.trim().startsWith('<div id="fy-')) {
          JsxRenderer.appendLegitimateComponentsToHtml(childText, dom, child);
        } else {
          dom.appendChild(document.createTextNode(childText));
        }
      } else if (child) {
        dom.appendChild(JsxRenderer.transformJsxToHtml(child));
      }
    }

    return dom;
  }

  private static nodeIsNumberOrBoolean(node: any): boolean {
    return typeof node === 'number' ||
      typeof node === 'boolean';
  }

  private static appendLegitimateComponentsToHtml(childText: string, dom: HTMLElement, child: string | Jsx) {
    const componentId = childText.split('<div id="')[1].split('"')[0];

    if (Component.IssuedIds.indexOf(componentId) >= 0) {
      dom.innerHTML += child;
    } else {
      dom.appendChild(document.createTextNode(childText));
    }
  }
}
