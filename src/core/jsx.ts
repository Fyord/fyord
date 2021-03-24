import { Command } from 'tsbase/Patterns/CommandQuery/Command';
import { Component } from './component';

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

  // eslint-disable-next-line complexity
  private static transformJsxToHtml(jsx: Jsx): HTMLElement {
    const dom: HTMLElement = document.createElement(jsx.nodeName);
    for (const key in jsx.attributes) {
      new Command(() => {
        dom.setAttribute(key, jsx.attributes[key]);
      }).Execute();
    }

    for (const child of jsx.children) {
      if (typeof child === 'string' || JsxRenderer.nodeIsNumberOrBoolean(child)) {
        const childText = child.toString();
        if (childText.trim().startsWith('<div id="fj-')) {
          JsxRenderer.appendLegitimateComponentsToHtml(childText, dom, child);
        } else {
          dom.appendChild(document.createTextNode(childText));
        }
      } else {
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
