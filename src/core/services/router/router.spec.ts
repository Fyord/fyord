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
    mockWindow.Setup(w => w.scroll(0, 0));
    mockDocument.Setup(d => d.getElementById(Strings.Empty), null);

    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);
  });

  it('should construct', () => {
    expect(classUnderTest).toBeDefined();
  });

  it('should clear handled route on route change', async () => {
    classUnderTest['RouteHandled'] = '123';

    await classUnderTest.Route.Publish(route);

    expect(classUnderTest['RouteHandled']).toEqual(Strings.Empty);
  });

  it('should get route to href with route params', async () => {
    const href = `${host}/one/two/`;
    mockXssSanitizer.Setup(s => s.PlainText('one'), 'one');
    mockXssSanitizer.Setup(s => s.PlainText('two'), 'two');
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    const route = await classUnderTest.RouteTo(href);

    expect(route.routeParams.length).toEqual(2);
  });

  it('should get route to href with route params without pushing to history api', async () => {
    mockHistory.Setup(h => h.pushState({}, Strings.Empty, Strings.Empty));
    const href = `${host}/one/two/`;
    mockXssSanitizer.Setup(s => s.PlainText('one'), 'one');
    mockXssSanitizer.Setup(s => s.PlainText('two'), 'two');
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    const route = await classUnderTest.RouteTo(href, false);

    expect(mockHistory.Verify(h => h.pushState({}, Strings.Empty, Strings.Empty), Times.Never));
    expect(route.routeParams.length).toEqual(2);
  });

  it('should get route from href with hash params', async () => {
    const href = `${host}#one#two`;
    mockXssSanitizer.Setup(s => s.PlainText('one'), 'one');
    mockXssSanitizer.Setup(s => s.PlainText('two'), 'two');
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    const route = await classUnderTest.RouteTo(href);

    expect(route.hashParams.length).toEqual(2);
  });

  it('should get route from href with query params', async () => {
    const href = `${host}?one=one&two=two`;
    mockXssSanitizer.Setup(s => s.PlainText('one'), 'one');
    mockXssSanitizer.Setup(s => s.PlainText('two'), 'two');
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    const route = await classUnderTest.RouteTo(href);

    expect(route.queryParams.size).toEqual(2);
  });

  it('should get route from href with a single query param', async () => {
    const href = `${host}?one=one`;
    mockXssSanitizer.Setup(s => s.PlainText('one'), 'one');
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    const route = await classUnderTest.RouteTo(href);

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
    await classUnderTest.Route.Publish(route);

    Asap(() => {
      TestHelpers.EmitEventAtElement(routedElement, EventTypes.Click);
      TestHelpers.EmitEventAtElement(currentPageElement, EventTypes.Click);
      TestHelpers.EmitEventAtElement(targetBlankElement, EventTypes.Click);
    });

    await classUnderTest.RouteTo('/test');
    history.pushState({}, 'test', 'test');
    history.back();

    const routingAssertionsMet = await TestHelpers.TimeLapsedCondition(() => {
      return routedElement.getAttribute('routed') !== null &&
        mockHistory.TimesMemberCalled(h => h.pushState({}, Strings.Empty, Strings.Empty)) >= 1;
    });

    expect(routingAssertionsMet).toBeTruthy();
  });

  it('should scroll to the top of the page on route change when no hash id available', async () => {
    const href = `${host}`;
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    await classUnderTest.RouteTo(href);

    const scrollCalled = await TestHelpers.TimeLapsedCondition(() => {
      return mockWindow.TimesMemberCalled(w => w.scroll(0, 0)) >= 1;
    });
    expect(scrollCalled).toBeTruthy();
  });

  it('should scroll to the top of the page on route change when no hash id available', async () => {
    mockWindow.Setup(w => w.scrollTo(0, 0));
    const scrollToElement = document.createElement('div');
    scrollToElement.id = 'fake';
    const href = `${host}#fake`;
    mockDocument.Setup(d => d.getElementById('fake'), scrollToElement);
    classUnderTest = Router.Instance(mockWindow.Object, mockXssSanitizer.Object);

    await classUnderTest.RouteTo(href);

    const scrollToCalled = await TestHelpers.TimeLapsedCondition(() => {
      return mockWindow.TimesMemberCalled(w => w.scrollTo(0, 0)) >= 1;
    });
    expect(scrollToCalled).toBeTruthy();
  });

  it('should not scroll on route event with no route data', async () => {
    classUnderTest.Route.Publish();
    mockWindow.Verify(w => w.scroll(0, 0), Times.Never);
  });
});
