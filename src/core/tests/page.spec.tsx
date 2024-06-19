import { ParseJsx } from '../jsx';
import { Mock, Times } from 'tsmockit';
import { Strings } from 'tsbase/System/Strings';
import { AsyncObservable } from 'tsbase/Patterns/Observable/AsyncObservable';
import { TestHelpers } from '../../utilities/testHelpers';
import { App } from '../app';
import { Page } from '../page';
import { IRouter, ISeoService, Route } from '../services/module';

class FakePage extends Page {
  Template = async () => <div>test</div>;
  Route = async () => this.routeMatches;

  constructor(
    private routeMatches: boolean,
    seoService?: ISeoService,
    app?: App,
    windowDocument?: Document
  ) {
    super(seoService, app, windowDocument);
  }
}

describe('Page', () => {
  let classUnderTest: FakePage;
  const mockDocument = new Mock<Document>();
  const mockRouter = new Mock<IRouter>();
  const mockApp = new Mock<App>();
  const mockSeoService = new Mock<ISeoService>();
  let fakeRouteObservable: AsyncObservable<Route>;
  let fakeRoute: Route;
  const id = '12345';

  beforeEach(() => {
    const fakeElement = document.createElement('div');
    fakeRouteObservable = new AsyncObservable<Route>();
    fakeRoute = {
      hashParams: [],
      href: '',
      path: '',
      queryParams: new Map<string, string>(),
      routeParams: []
    };
    mockDocument.Setup(d => d.getElementById(''), fakeElement);
    mockRouter.Setup(r => r.Route, fakeRouteObservable);
    mockRouter.Setup(r => r.RouteHandled, id);
    mockApp.Setup(a => a.Router, mockRouter.Object);
    mockSeoService.Setup(s => s.SetDefaultTags());
    mockApp.Setup(a => a.UpdateLayout());

    classUnderTest = new FakePage(true, mockSeoService.Object, mockApp.Object, mockDocument.Object);
    classUnderTest.Id = id;
  });

  it('should construct', () => {
    expect(classUnderTest).toBeDefined();
  });

  it('should construct with default parameters', () => {
    expect(new FakePage(false)).toBeDefined();
  });

  it('should handle route changes when the new route is not a match', async () => {
    classUnderTest = new FakePage(false, mockSeoService.Object, mockApp.Object, mockDocument.Object);
    await fakeRouteObservable.Publish(fakeRoute);
    mockRouter.Verify(r => r.RouteHandled, Times.Never);
  });

  it('should handle route changes on match and render', async () => {
    fakeRoute.path = '/new-path';
    fakeRoute.href = 'http://localhost/new-path';
    const fakeHead = document.createElement('head');
    fakeHead.innerHTML = 'test';
    const fakeElement = document.createElement('div');
    mockDocument.SetupSequence([
      [d => d.getElementById(id), null],
      [d => d.getElementById(id), fakeElement],
      [d => d.getElementById(id), fakeElement]
    ]);
    mockDocument.Setup(d => d.head, fakeHead);
    const fakeMain = document.createElement('main');
    mockApp.Setup(a => a.Main, fakeMain);
    mockRouter.Setup(r => r.RouteHandled, Strings.Empty);
    classUnderTest = new FakePage(true, mockSeoService.Object, mockApp.Object, mockDocument.Object);

    await fakeRouteObservable.Publish(fakeRoute);

    await TestHelpers.Expect(
      () => {
        return fakeMain.innerHTML;
      },
      () => {
        expect(fakeMain.innerHTML).toContain('<div id=\"12345\" style=\"display: block;\"><div>test</div></div>');
        expect(fakeMain.innerHTML).toContain('<!-- fyord-hybrid-render -->');
      });
  });

  it('should not re render if the component is already rendered at the same path', async () => {
    const fakeElement = document.createElement('div');
    mockDocument.Setup(d => d.getElementById(id), fakeElement);
    const fakeMain = document.createElement('main');
    mockApp.Setup(a => a.Main, fakeMain);
    mockRouter.Setup(r => r.RouteHandled, Strings.Empty);
    classUnderTest = new FakePage(true, mockSeoService.Object, mockApp.Object, mockDocument.Object);

    await fakeRouteObservable.Publish(fakeRoute);

    mockApp.Verify(a => a.Main, Times.Never);
  });

  it('should not render if the client has moved on to another route by the time component is ready', async () => {
    mockDocument.Setup(d => d.getElementById(id), null);
    const fakeMain = document.createElement('main');
    mockApp.Setup(a => a.Main, fakeMain);
    mockRouter.Setup(r => r.RouteHandled, Strings.Empty);
    classUnderTest = new FakePage(true, mockSeoService.Object, mockApp.Object, mockDocument.Object);

    await fakeRouteObservable.Publish(fakeRoute);
    mockRouter.Setup(r => r.RouteHandled, Strings.Empty);

    mockApp.Verify(a => a.Main, Times.Never);
  });
});
