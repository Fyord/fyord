import { Strings } from 'tsbase/System/Strings';
import { Component } from '../../component';
import { Jsx } from '../../jsx';
import { Route } from '../../services/module';
import { Session, Local } from '../storage';

class TestComponent extends Component {
  public Template: (route?: Route) => Promise<Jsx> = async () => (Strings.Empty as any);
  @Session public SessionTest: any = 'session';
  @Local public LocalTest: any = 'local';
}

describe('Storage Decorators', () => {
  const testComponent = new TestComponent();

  it('should store a string in session storage', () => {
    expect(testComponent.SessionTest).toEqual('session');
    expect(window.sessionStorage.getItem('SessionTest')).toEqual('session');
  });

  it('should store a string in local storage', () => {
    expect(testComponent.LocalTest).toEqual('local');
    expect(window.localStorage.getItem('LocalTest')).toEqual('local');
  });

  it('should store a number and retrieve a number', () => {
    testComponent.SessionTest = 1;

    expect(testComponent.SessionTest).toEqual(1);
    expect(window.sessionStorage.getItem('SessionTest')).toEqual('1');
  });

  it('should store a number as a string and retrieve a string', () => {
    testComponent.SessionTest = '1';

    expect(testComponent.SessionTest).toEqual('1');
    expect(window.sessionStorage.getItem('SessionTest')).toEqual('1');
  });

  it('should store an array', () => {
    testComponent.LocalTest = [1, 2, 3];

    expect(testComponent.LocalTest).toEqual([1, 2, 3]);
    expect(window.localStorage.getItem('LocalTest')).toEqual('[1,2,3]');
  });

  it('should store an object', () => {
    testComponent.SessionTest = { one: 1, two: 2, three: 3 };

    expect(testComponent.SessionTest).toEqual({ one: 1, two: 2, three: 3 });
    expect(window.sessionStorage.getItem('SessionTest')).toEqual('{\"one\":1,\"two\":2,\"three\":3}');
  });

  it('should store a boolean and retrieve a boolean', () => {
    testComponent.SessionTest = true;

    expect(testComponent.SessionTest).toEqual(true);
    expect(window.sessionStorage.getItem('SessionTest')).toEqual('true');
  });

  it('should store a boolean as a string and retrieve a string', () => {
    testComponent.SessionTest = 'true';

    expect(testComponent.SessionTest).toEqual('true');
    expect(window.sessionStorage.getItem('SessionTest')).toEqual('true');
  });

  it('should store a boolean as a string and retrieve a string', () => {
    testComponent.SessionTest = undefined;

    expect(testComponent.SessionTest).toEqual('undefined');
    expect(window.sessionStorage.getItem('SessionTest')).toEqual('undefined');
  });
});
