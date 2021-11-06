import { Mock, TestHelpers as _TestHelpers } from 'tsmockit';
import { Observable } from 'tsbase/Patterns/Observable/Observable';
import { Strings } from 'tsbase/System/Strings';
import { App, IRouter, ISeoService, Route } from '../core/module';

export class TestHelpers extends _TestHelpers {
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
}
