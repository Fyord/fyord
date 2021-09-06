import { Strings } from 'tsbase/Constants/Strings';
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
  });

  it('should store a string in local storage', () => {
    expect(testComponent.LocalTest).toEqual('local');
  });

  it('should store a number', () => {
    testComponent.SessionTest = 1;
    expect(testComponent.SessionTest).toEqual(1);
  });

  it('should store an array', () => {
    testComponent.LocalTest = [1, 2, 3];
    expect(testComponent.LocalTest).toEqual([1, 2, 3]);
  });

  it('should store an object', () => {
    testComponent.SessionTest = { one: 1, two: 2, three: 3 };
    expect(testComponent.SessionTest).toEqual({ one: 1, two: 2, three: 3 });
  });
});
