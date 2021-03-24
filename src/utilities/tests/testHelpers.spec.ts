import { Mock } from 'tsmockit';
import { Observable } from 'tsbase/Patterns/Observable/Observable';
import { EventTypes } from '../../core/eventTypes';
import { App, IRouter, ISeoService, Route } from '../../core/module';
import { Strings } from 'tsbase/Constants/Strings';

export class TestHelpers {
  public static GetPageMocks() {
    const mockRoute = new Mock<Observable<Route>>();
    const mockRouter = new Mock<IRouter>();
    const mockApp = new Mock<App>();
    const mockDocument = new Mock<Document>();
    const mockSeoService = new Mock<ISeoService>();

    mockSeoService.Setup(s => s.SetDefaultTags(Strings.Empty));
    mockRoute.Setup(r => r.Subscribe(() => null));
    mockRouter.Setup(r => r.Route, mockRoute.Object);
    mockApp.Setup(a => a.Router, mockRouter.Object);

    return {
      mockApp: mockApp,
      mockDocument: mockDocument,
      mockRouter: mockRouter,
      mockRoute: mockRoute,
      mockSeoService: mockSeoService
    };
  }

  public static EmitEventAtElement(element: HTMLElement, eventType: EventTypes): void {
    const event = document.createEvent('Event');
    event.initEvent(eventType);
    element.dispatchEvent(event);
  }

  public static EmitKeyEventAtElement(
    element: HTMLInputElement,
    key: string,
    keyEvent: EventTypes.Keydown | EventTypes.Keypress | EventTypes.Keyup | EventTypes.Input
  ): void {
    const event = document.createEvent('Event');

    event['keyCode'] = key;
    event['key'] = key;

    event.initEvent(keyEvent);
    element.dispatchEvent(event);
  }

  public static async TimeLapsedCondition(condition: () => boolean, interval = 10): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let assertionPassed = false;
      let elapsedTime = 0;
      const enabled = (() => {
        return !assertionPassed && elapsedTime < 1000;
      });

      const executer = setInterval(async () => {
        elapsedTime += interval;
        if (enabled()) {
          assertionPassed = condition();
        } else {
          clearInterval(executer);
          resolve(assertionPassed);
        }
      }, interval);
    });
  }
}


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
    const pageMocks = TestHelpers.GetPageMocks();

    expect(pageMocks.mockDocument).toBeDefined();
    expect(pageMocks.mockApp).toBeDefined();
    expect(pageMocks.mockRouter).toBeDefined();
    expect(pageMocks.mockRoute).toBeDefined();
  });
});
