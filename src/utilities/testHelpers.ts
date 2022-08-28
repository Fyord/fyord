import { EmitEventAtElement, EmitKeyEventAtElement, Expect, Mock } from 'tsmockit';
import { Observable } from 'tsbase/Patterns/Observable/Observable';
import { Strings } from 'tsbase/System/Strings';
import { App, IRouter, ISeoService, Route } from '../core/module';

export class TestHelpers {
  public static GetComponentMocks() {
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

  public static Expect = Expect;
  public static EmitEventAtElement = EmitEventAtElement;
  public static EmitKeyEventAtElement = EmitKeyEventAtElement;

  /**
   * Wait up to 1 second for a given condition to be true
   * @deprecated Will be removed in version 3 - Use "Expect" instead
   * @param condition
   * @param interval
   * @returns true if condition is met before 1 second limit, false otherwise
   */
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
