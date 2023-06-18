/**
 * @jest-environment jsdom
 */

import { Strings } from 'tsbase/System/Strings';
import { RecursiveReRender } from '../recursiveReRender';

describe('RecursiveReRender', () => {
  const oldElement = document.createElement('div');
  const newElement = document.createElement('div');

  beforeEach(() => {
    oldElement.innerHTML = Strings.Empty;
    newElement.innerHTML = Strings.Empty;
  });

  it('should exit without updating when there are no changes', () => {
    const content = '<p>test</p>';
    oldElement.innerHTML = content;
    newElement.innerHTML = content;

    const result = RecursiveReRender(oldElement, newElement);

    expect(result.IsSuccess).toBeTruthy();
  });

  it('should update the old element\'s inner html at the top level when there are changes and no children', () => {
    oldElement.innerHTML = 'one';
    newElement.innerHTML = 'two';

    const result = RecursiveReRender(oldElement, newElement);

    expect(result.IsSuccess).toBeTruthy();
    expect(oldElement.innerHTML).toEqual('two');
  });

  it('should update the old element\'s children when a change is found', () => {
    oldElement.innerHTML = '<p>one</p>';
    newElement.innerHTML = '<p>two</p>';

    const result = RecursiveReRender(oldElement, newElement);

    expect(result.IsSuccess).toBeTruthy();
    expect(oldElement.innerHTML).toEqual('<p>two</p>');
  });

  it('should update the old element\'s children when a change is found n levels deep', () => {
    oldElement.innerHTML = '<div><div><div><div><div>one</div></div></div></div></div>';
    newElement.innerHTML = '<div><div><div><div><div>two</div></div></div></div></div>';

    const result = RecursiveReRender(oldElement, newElement);

    expect(result.IsSuccess).toBeTruthy();
    expect(oldElement.innerHTML).toEqual('<div><div><div><div><div>two</div></div></div></div></div>');
  });

  it('should update the parent\'s inner html of a child incompatible with it revision', () => {
    oldElement.innerHTML = '<p>one</p>';
    newElement.innerHTML = '<div>two</div>';

    const result = RecursiveReRender(oldElement, newElement);

    expect(result.IsSuccess).toBeTruthy();
    expect(oldElement.innerHTML).toEqual('<div>two</div>');
  });

  it('should update attributes, for rendered children', () => {
    oldElement.innerHTML = '<div class="one">one</div>';
    newElement.innerHTML = '<div class="one two">one</div>';

    const result = RecursiveReRender(oldElement, newElement);

    expect(result.IsSuccess).toBeTruthy();
    expect(oldElement.innerHTML).toEqual('<div class="one two">one</div>');
  });

  it('should not update attributes in the no update list (ex: id) for rendered children', () => {
    oldElement.innerHTML = '<div class="one" id="one">one</div>';
    newElement.innerHTML = '<div class="one two" id="two">one</div>';

    const result = RecursiveReRender(oldElement, newElement);

    expect(result.IsSuccess).toBeTruthy();
    expect(oldElement.innerHTML).toEqual('<div class="one two" id="one">one</div>');
  });

  it('should remove attributes that are no longer set, excluding no change attributes', () => {
    oldElement.innerHTML = '<div id="one" class="one">one</div>';
    newElement.innerHTML = '<div>two</div>';

    const result = RecursiveReRender(oldElement, newElement);

    expect(result.IsSuccess).toBeTruthy();
    expect(oldElement.innerHTML).toEqual('<div id="one">two</div>');
  });

  it('should change id attributes when the value starts with "fy-"', () => {
    oldElement.innerHTML = '<div id="fy-test-1">one</div>';
    newElement.innerHTML = '<div id="fy-test-2">two</div>';

    const result = RecursiveReRender(oldElement, newElement);

    expect(result.IsSuccess).toBeTruthy();
    expect(oldElement.innerHTML).toEqual('<div id="fy-test-2">two</div>');
  });
});
