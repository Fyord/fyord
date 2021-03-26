import { EventTypes } from '../../core/eventTypes';
import { TestHelpers } from '../testHelpers';

describe('TestHelpers', () => {

  it('should emit key event at element', async () => {
    let eventFired = false;
    const testElement = document.createElement('input');
    testElement.addEventListener(EventTypes.Input, () => eventFired = true);

    TestHelpers.EmitKeyEventAtElement(testElement, 'a', EventTypes.Input);

    expect(await TestHelpers.TimeLapsedCondition(() => eventFired)).toBeTruthy();
  });

  it('should emit event at element', async () => {
    let eventFired = false;
    const testElement = document.createElement('button');
    testElement.addEventListener(EventTypes.Click, () => eventFired = true);

    TestHelpers.EmitEventAtElement(testElement, EventTypes.Click);

    expect(await TestHelpers.TimeLapsedCondition(() => eventFired)).toBeTruthy();
  });

  it('should detect a time lapsed condition', async () => {
    let variable = false;
    setTimeout(() => {
      variable = true;
    }, 5);

    const variableIsTrue = await TestHelpers.TimeLapsedCondition(() => variable);

    expect(variableIsTrue).toBeTruthy();
  });

  it('should return mocks needed to test a page', () => {
    const pageMocks = TestHelpers.GetComponentMocks();

    expect(pageMocks.mockDocument).toBeDefined();
    expect(pageMocks.mockApp).toBeDefined();
    expect(pageMocks.mockRouter).toBeDefined();
    expect(pageMocks.mockRoute).toBeDefined();
  });
});
