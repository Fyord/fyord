import { Mock, Times } from 'tsmockit';
import { Observable } from 'tsbase/Patterns/Observable/module';
import { LogEntry } from 'tsbase/Utility/Logger/LogEntry';
import { Environments } from '../environments';
import { App } from '../app';
import { IRouter, Route } from '../services/module';
import { ParseJsx, Fragment } from '../jsx';

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
  const fakeRouteObservable = new Observable<Route>();
  const mockRouter = new Mock<IRouter>();
  const mockDocument = new Mock<Document>();
  const mockConsole = new Mock<Console>();
  const layout = async () => <></>;

  beforeEach(() => {
    const appRootDiv = document.createElement('div');
    mockDocument.Setup(d => d.getElementById('app-root'), appRootDiv);
    mockConsole.Setup(c => c.warn({} as LogEntry));
    mockRouter.Setup(r => r.Route, fakeRouteObservable);

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
    expect(classUnderTest.Store.GetState<string>('test')).toEqual('test');
  });

  async function setupStartedApp(): Promise<Observable<Route>> {
    App.Destroy();
    const fakeDiv = document.createElement('div');
    mockDocument.Setup(d => d.getElementById('app-root-layout'), fakeDiv);
    mockRouter.Setup(r => r.UseClientRouting());
    mockRouter.Setup(r => r.GetRouteFromHref(''), {} as Route);
    mockRouter.Setup(r => r.RouteTo(''), {} as Route);
    classUnderTest = App.Instance(
      Environments.Production,
      ProductionEnvironmentVariables,
      DevelopmentEnvironmentVariables,
      mockRouter.Object,
      mockDocument.Object);

    await classUnderTest.Start(layout);

    return fakeRouteObservable;
  }

  const newLayout = <><header></header><main></main><footer></footer></>;
  it('should update the layout to the default when no custom layout is passed', async () => {
    await setupStartedApp();
    await classUnderTest.UpdateLayout(async () => newLayout);

    await classUnderTest.UpdateLayout();

    mockDocument.Verify(d => d.getElementById('app-root-layout'), 2);
  });

  it('should update the layout to the a given jsx layout', async () => {
    await setupStartedApp();

    await classUnderTest.UpdateLayout(async () => newLayout);

    mockDocument.Verify(d => d.getElementById('app-root-layout'), 1);
    expect(classUnderTest['currentLayout']).toEqual(newLayout);
  });

  it('should not update the layout when update is called with the same layout', async () => {
    const newLayout = <><header></header><main></main><footer></footer></>;
    await setupStartedApp();

    await classUnderTest.UpdateLayout(async () => newLayout);
    await classUnderTest.UpdateLayout(async () => newLayout);
    await classUnderTest.UpdateLayout(async () => newLayout);

    mockDocument.Verify(d => d.getElementById('app-root-layout'), 3);
    expect(classUnderTest['currentLayout']).toEqual(newLayout);
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
