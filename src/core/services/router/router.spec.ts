import { Mock, Times } from 'tsmockit';
import { Strings } from 'tsbase/Functions/Strings';
import { IXssSanitizerService } from '../xssSanitizerService/xssSanitizerService';
import { TestHelpers } from '../../../utilities/testHelpers';
import { Route } from './route';
import { IRouter, Router } from './router';
import { EventTypes } from '../../eventTypes';
import { Asap } from '../../../utilities/asap';

describe('Router', () => {
  let classUnderTest: IRouter;
  const host = 'http://localhost:9876';
  const mockLocation = new Mock<Location>();
  const mockDocument = new Mock<Document>();
  const mockWindow = new Mock<Window>();
  const mockXssSanitizer = new Mock<IXssSanitizerService>();
  const mockHistory = new Mock<History>();
  const route = {
    hashParams: [],
    href: Strings.Empty,
    path: '/test',
    queryParams: new Map<string, string>(),
    routeParams: []
  } as Route;

  beforeEach(() => {
    Router.Destroy();
    mockLocation.Setup(l => l.host, host);
    mockLocation.Setup(l => l.origin, host);
    mockWindow.Setup(w => w.location, mockLocation.Object);
    mockWindow.Setup(w => w.document, mockDocument.Object);
    mockWindow.Setup(w => w.history, mockHistory.Object);
    mockHistory.Setup(h => h.pushState({}, Strings.Empty, Strings.Empty));

    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);
  });

  it('should construct', () => {
    expect(classUnderTest).toBeDefined();
  });

  it('should clear handled route on route change', () => {
    classUnderTest['RouteHandled'] = '123';

    classUnderTest.Route.Publish(route);

    expect(classUnderTest['RouteHandled']).toEqual(Strings.Empty);
  });

  it('should get route to href with route params', () => {
    const href = `${host}/one/two/`;
    mockXssSanitizer.Setup(s => s.PlainText('one'), 'one');
    mockXssSanitizer.Setup(s => s.PlainText('two'), 'two');
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    const route = classUnderTest.RouteTo(href);

    expect(route.routeParams.length).toEqual(2);
  });

  it('should get route to href with route params without pushing to history api', () => {
    mockHistory.Setup(h => h.pushState({}, Strings.Empty, Strings.Empty));
    const href = `${host}/one/two/`;
    mockXssSanitizer.Setup(s => s.PlainText('one'), 'one');
    mockXssSanitizer.Setup(s => s.PlainText('two'), 'two');
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    const route = classUnderTest.RouteTo(href, false);

    expect(mockHistory.Verify(h => h.pushState({}, Strings.Empty, Strings.Empty), Times.Never));
    expect(route.routeParams.length).toEqual(2);
  });

  it('should get route from href with hash params', () => {
    const href = `${host}#one#two`;
    mockXssSanitizer.Setup(s => s.PlainText('one'), 'one');
    mockXssSanitizer.Setup(s => s.PlainText('two'), 'two');
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    const route = classUnderTest.RouteTo(href);

    expect(route.hashParams.length).toEqual(2);
  });

  it('should get route from href with query params', () => {
    const href = `${host}?one=one&two=two`;
    mockXssSanitizer.Setup(s => s.PlainText('one'), 'one');
    mockXssSanitizer.Setup(s => s.PlainText('two'), 'two');
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    const route = classUnderTest.RouteTo(href);

    expect(route.queryParams.size).toEqual(2);
  });

  it('should get route from href with a single query param', () => {
    const href = `${host}?one=one`;
    mockXssSanitizer.Setup(s => s.PlainText('one'), 'one');
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    const route = classUnderTest.RouteTo(href);

    expect(route.queryParams.size).toEqual(1);
  });

  it('should use client routing', async () => {
    mockHistory.Setup(h => h.pushState({}, Strings.Empty, Strings.Empty));
    const currentPage = `${host}/test`;
    const routedElement = document.createElement('a');
    routedElement.href = `${host}/fake`;
    const preRoutedElement = document.createElement('a');
    preRoutedElement.setAttribute('routed', 'true');
    const targetBlankElement = document.createElement('a');
    targetBlankElement.target = '_blank';
    const currentPageElement = document.createElement('a');
    currentPageElement.href = currentPage;
    mockLocation.Setup(s => s.href, currentPage);
    mockDocument.Setup(d => d.querySelectorAll(Strings.Empty), [
      preRoutedElement, routedElement, targetBlankElement, currentPageElement]);
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    classUnderTest.UseClientRouting();
    classUnderTest.Route.Publish(route);

    Asap(() => {
      TestHelpers.EmitEventAtElement(routedElement, EventTypes.Click);
      TestHelpers.EmitEventAtElement(currentPageElement, EventTypes.Click);
      TestHelpers.EmitEventAtElement(targetBlankElement, EventTypes.Click);
    });

    classUnderTest.RouteTo('/test');
    history.pushState({}, 'test', 'test');
    history.back();

    const routingAssertionsMet = await TestHelpers.TimeLapsedCondition(() => {
      return routedElement.getAttribute('routed') !== null &&
        mockHistory.TimesMemberCalled(h => h.pushState({}, Strings.Empty, Strings.Empty)) >= 1;
    });

    expect(routingAssertionsMet).toBeTruthy();
  });
});
