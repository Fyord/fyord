import { ParseJsx } from '../jsx';
import { Mock, Times } from 'tsmockit';
import { Strings } from 'tsbase/System/Strings';
import { AsyncObservable } from 'tsbase/Patterns/Observable/AsyncObservable';
import { TestHelpers } from '../../utilities/testHelpers';
import { App } from '../app';
import { Page } from '../page';
import { IRouter, ISeoService, Route } from '../services/module';

const id = '12345';

class FakePage extends Page {
  Template = async () => <div>test</div>;
  Route = async () => this.routeMatches;

  constructor(
    public routeMatches: boolean,
    seoService?: ISeoService,
    app?: App,
    windowDocument?: Document
  ) {
    super(seoService, app, windowDocument);
    this.Id = id;
  }
}

class FakePageWithHeadElements extends FakePage {
  HeadElements = async () => [
    <script src="fake" />,
    <style link="fake" />
  ];
}

describe('Page', () => {
  let classUnderTest: FakePage;
  let mockDocument: Mock<Document>;
  const mockRouter = new Mock<IRouter>();
  const mockApp = new Mock<App>();
  const mockSeoService = new Mock<ISeoService>();
  let fakeRouteObservable: AsyncObservable<Route>;
  let fakeRoute: Route;

  beforeEach(() => {
    mockDocument = new Mock<Document>();
    fakeRouteObservable = new AsyncObservable<Route>();
    fakeRoute = {
      hashParams: [],
      href: '',
      path: '',
      queryParams: new Map<string, string>(),
      routeParams: []
    };
    mockRouter.Setup(r => r.Route, fakeRouteObservable);
    mockRouter.Setup(r => r.RouteHandled, id);
    mockApp.Setup(a => a.Router, mockRouter.Object);
    mockSeoService.Setup(s => s.SetDefaultTags());
    mockApp.Setup(a => a.UpdateLayout());
    mockRouter.Setup(r => r.UseClientRouting());
    mockDocument.Setup(d => d.createElement('script'), document.createElement('script'));
    mockDocument.Setup(d => d.createElement('style'), document.createElement('style'));

    classUnderTest = new FakePage(false, mockSeoService.Object, mockApp.Object, mockDocument.Object);
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
    const fakeMain = document.createElement('main');
    const fakeElement = {
      parentElement: fakeMain
    };
    mockDocument.SetupSequence([
      [d => d.getElementById(id), null],
      [d => d.getElementById(id), null],
      [d => d.getElementById(id), fakeElement],
      [d => d.getElementById(id), fakeElement]
    ]);
    mockDocument.Setup(d => d.head, fakeHead);
    mockApp.Setup(a => a.Main, fakeMain);
    mockRouter.Setup(r => r.RouteHandled, Strings.Empty);
    classUnderTest = new FakePageWithHeadElements(true, mockSeoService.Object, mockApp.Object, mockDocument.Object);

    await fakeRouteObservable.Publish(fakeRoute);

    await TestHelpers.Expect(
      () => {
        return fakeMain.innerHTML;
      },
      () => {
        expect(fakeMain.innerHTML).toContain('<div id=\"12345\" style=\"display: block;\"><div>test</div></div>');
        expect(fakeMain.innerHTML).toContain('<!-- fyord-hybrid-render -->');
      });

    await TestHelpers.Expect(
      () => fakeHead.innerHTML.includes('script') && fakeHead.innerHTML,
      m => m.toContain('<script src=\"fake\"></script><style link=\"fake\"></style>'));
  });

  it('should remove head elements when routing away from page that rendered them', async () => {
    fakeRoute.path = '/new-path';
    fakeRoute.href = 'http://localhost/new-path';
    const fakeHead = document.createElement('head');
    fakeHead.innerHTML = 'test';
    const fakeMain = document.createElement('main');
    const mockElement = new Mock<HTMLElement>();
    mockElement.Setup(e => e.parentElement, fakeMain);
    mockDocument.SetupSequence([
      [d => d.getElementById(id), null],
      [d => d.getElementById(id), null],
      [d => d.getElementById(id), mockElement.Object],
      [d => d.getElementById(id), mockElement.Object]
    ]);
    mockDocument.Setup(d => d.head, fakeHead);
    mockApp.Setup(a => a.Main, fakeMain);
    mockRouter.Setup(r => r.RouteHandled, Strings.Empty);
    classUnderTest = new FakePageWithHeadElements(true, mockSeoService.Object, mockApp.Object, mockDocument.Object);

    await fakeRouteObservable.Publish(fakeRoute);

    await TestHelpers.Expect(
      () => fakeHead.innerHTML.includes('script') && fakeHead.innerHTML,
      m => m.toContain('<script src=\"fake\"></script><style link=\"fake\"></style>'));

    classUnderTest.routeMatches = false;
    mockRouter.Object.RouteHandled = '';
    fakeRouteObservable.Publish(fakeRoute);
    classUnderTest['disconnect']();

    await TestHelpers.Expect(
      () => !fakeHead.innerHTML.includes('script') && fakeHead.innerHTML,
      m => m.toEqual('test'));
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
