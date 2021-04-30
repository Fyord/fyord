import { Mock, Times } from 'tsmockit';
import { Observable } from 'tsbase/Patterns/Observable/module';
import { LogEntry } from 'tsbase/Utility/Logger/LogEntry';
import { Environments } from '../environments';
import { App } from '../app';
import { IRouter, Route } from '../services/module';
import { ParseJsx, Fragment } from '../jsx';
import { Strings } from 'tsbase/Functions/Strings';

enum EnvironmentVariables {
  Mode = 'mode',
  ApiServer = 'apiServer'
}

const DevelopmentEnvironmentVariables = new Map<string, string>([
  [EnvironmentVariables.Mode, Environments.Development],
  [EnvironmentVariables.ApiServer, 'http://localhost:5000']
]);

const ProductionEnvironmentVariables = new Map<string, string>([
  [EnvironmentVariables.Mode, Environments.Production],
  [EnvironmentVariables.ApiServer, 'http://www.example.com/api']
]);

describe('App', () => {
  let classUnderTest: App;
  const mockRouter = new Mock<IRouter>();
  const mockDocument = new Mock<Document>();
  const mockConsole = new Mock<Console>();

  beforeEach(() => {
    const appRootDiv = document.createElement('div');
    mockDocument.Setup(d => d.getElementById('app-root'), appRootDiv);
    mockConsole.Setup(c => c.warn({} as LogEntry));

    classUnderTest = App.Instance(
      Environments.Development,
      ProductionEnvironmentVariables,
      DevelopmentEnvironmentVariables,
      mockRouter.Object,
      mockDocument.Object,
      mockConsole.Object);
  });

  it('should construct with no environment defined', () => {
    expect(classUnderTest).toBeDefined();
    expect(classUnderTest.EnvironmentVariables.get(EnvironmentVariables.Mode))
      .toEqual(Environments.Development);
  });

  it('should construct with default params', () => {
    App.Destroy();
    expect(App.Instance()).toBeDefined();
  });

  it('should construct in development', () => {
    App.Destroy();
    classUnderTest = App.Instance(
      Environments.Development,
      ProductionEnvironmentVariables,
      DevelopmentEnvironmentVariables,
      mockRouter.Object,
      mockDocument.Object);

    expect(classUnderTest).toBeDefined();
    expect(classUnderTest.EnvironmentVariables.get(EnvironmentVariables.Mode))
      .toEqual(Environments.Development);
  });

  it('should construct in production', () => {
    App.Destroy();
    classUnderTest = App.Instance(
      Environments.Production,
      ProductionEnvironmentVariables,
      DevelopmentEnvironmentVariables,
      mockRouter.Object,
      mockDocument.Object);

    expect(classUnderTest).toBeDefined();
    expect(classUnderTest.EnvironmentVariables.get(EnvironmentVariables.Mode))
      .toEqual(Environments.Production);
  });

  it('should get the main element', () => {
    const fakeMain = document.createElement('main');
    mockDocument.Setup(d => d.querySelector('main'), fakeMain);

    const main = classUnderTest.Main;

    expect(main).toEqual(fakeMain);
  });

  it('should initialize the app store', () => {
    classUnderTest.InitializeStore({ test: 'test' });
    expect(classUnderTest.Store.GetStateAt<string>('test')).toEqual('test');
  });

  async function setupStartedApp(useJsx = true): Promise<Observable<Route>> {
    App.Destroy();
    const fakeRouteObservable = new Observable<Route>();
    const fakeDiv = document.createElement('div');
    mockDocument.Setup(d => d.getElementById('app-root-layout'), fakeDiv);
    mockRouter.Setup(r => r.UseClientRouting());
    mockRouter.Setup(r => r.GetRouteFromHref(''), {} as Route);
    mockRouter.Setup(r => r.RouteTo(''), {} as Route);
    mockRouter.Setup(r => r.Route, fakeRouteObservable);
    classUnderTest = App.Instance(
      Environments.Production,
      ProductionEnvironmentVariables,
      DevelopmentEnvironmentVariables,
      mockRouter.Object,
      mockDocument.Object);
    const layout = async () => useJsx ? <></> : Strings.Empty as any;

    await classUnderTest.Start(layout);

    return fakeRouteObservable;
  }

  it('should start the application given initial layout', async () => {
    const fakeRouteObservable = await setupStartedApp(false);

    fakeRouteObservable.Publish({} as Route);
    mockRouter.Verify(r => r.UseClientRouting(), Times.Once);
    mockRouter.Verify(r => r.GetRouteFromHref(''), Times.Once);
    mockDocument.Verify(d => d.getElementById('app-root-layout'), 2);
  });

  it('should subscribe to layout changes with empty string as default', async () => {
    await setupStartedApp();

    classUnderTest.Layout.Publish();
    mockDocument.Verify(d => d.getElementById('app-root-layout'), 2);
  });

  it('should subscribe to layout changes with jsx', async () => {
    await setupStartedApp();

    classUnderTest.Layout.Publish(<><header></header><main></main><footer></footer></>);
    mockDocument.Verify(d => d.getElementById('app-root-layout'), 2);
  });

  it('should not log logger entries to console as warnings when in prod mode', () => {
    App.Destroy();
    const fakeLogEntry = new LogEntry('test');
    mockConsole.Setup(c => c.warn(fakeLogEntry));
    classUnderTest = App.Instance(
      Environments.Production,
      ProductionEnvironmentVariables,
      DevelopmentEnvironmentVariables,
      mockRouter.Object,
      mockDocument.Object,
      mockConsole.Object);

    classUnderTest.Logger.Log(fakeLogEntry);

    mockConsole.Verify(c => c.warn(fakeLogEntry), Times.Never);
  });

  it('should log logger entries to console as warnings when in dev mode', () => {
    App.Destroy();
    const fakeLogEntry = new LogEntry('test');
    mockConsole.Setup(c => c.warn(fakeLogEntry));
    classUnderTest = App.Instance(
      Environments.Development,
      ProductionEnvironmentVariables,
      DevelopmentEnvironmentVariables,
      mockRouter.Object,
      mockDocument.Object,
      mockConsole.Object);

    classUnderTest.Logger.Log(fakeLogEntry);

    const logEntries = mockConsole.TimesMemberCalled(c => c.warn(fakeLogEntry));
    expect(logEntries).toBeGreaterThan(0);
  });
});
