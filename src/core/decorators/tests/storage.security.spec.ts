import { Component } from '../../component';
import { Jsx } from '../../jsx';
import { Route } from '../../services/module';
import { Embedded } from '../storage';

class TestEmbeddedComponent extends Component {
  public Template: (route?: Route) => Promise<Jsx> = async () => ('' as unknown as Jsx);
  @Embedded public Data: any = 'initial';
}

describe('EmbeddedStorage XSS: script tag breakout', () => {
  let component: TestEmbeddedComponent;

  beforeEach(() => {
    component = new TestEmbeddedComponent();
  });

  it('should not inject an img element into the DOM when storing </script><img id=...>', () => {
    const imgId = 'xss-injected-img';
    component.Data = `</script><img id="${imgId}" src=x onerror=alert(1)>`;

    const injectedImage = document.getElementById(imgId);
    expect(injectedImage).toBeNull();
  });

  it('should not inject arbitrary DOM elements via </script> breakout', () => {
    const injectedId = 'xss-injected-div';
    component.Data = `</script><div id="${injectedId}">injected</div>`;

    const injectedDiv = document.getElementById(injectedId);
    expect(injectedDiv).toBeNull();
  });

  it('should not inject DOM elements via </ScRiPt> (mixed case)', () => {
    const injectedId = 'xss-mixed-case';
    component.Data = `</ScRiPt><p id="${injectedId}">injected</p>`;

    const injectedElement = document.getElementById(injectedId);
    expect(injectedElement).toBeNull();
  });

  it('should preserve the exact stored value without HTML entity mangling', () => {
    const jsonStr = '{"name":"test","value":123}';
    component.Data = jsonStr;

    const scriptTag = document.getElementById('Data') as HTMLScriptElement;
    const stored = scriptTag.textContent || scriptTag.innerHTML;
    expect(stored).toEqual(jsonStr);
  });

  it('should preserve strings containing angle brackets without entity encoding', () => {
    const valueWithBrackets = '<div>safe content</div>';
    component.Data = valueWithBrackets;

    const scriptTag = document.getElementById('Data') as HTMLScriptElement;
    const stored = scriptTag.textContent || scriptTag.innerHTML;
    expect(stored).toEqual(valueWithBrackets);
  });

  it('should preserve strings containing script end tag', () => {
    const valueWithScriptEnd = 'prefix</script>suffix';
    component.Data = valueWithScriptEnd;

    const scriptTag = document.getElementById('Data') as HTMLScriptElement;
    const stored = scriptTag.textContent || scriptTag.innerHTML;
    expect(stored).toEqual(valueWithScriptEnd);
  });

  it('should preserve values containing HTML special characters', () => {
    const specialChars = '"\'&<>`';
    component.Data = specialChars;

    const scriptTag = document.getElementById('Data') as HTMLScriptElement;
    const stored = scriptTag.textContent || scriptTag.innerHTML;
    expect(stored).toEqual(specialChars);
  });

  it('should preserve stored integer value', () => {
    component.Data = 42;

    const scriptTag = document.getElementById('Data') as HTMLScriptElement;
    const stored = scriptTag.textContent || scriptTag.innerHTML;
    expect(stored).toEqual('42');
  });

  it('should preserve stored array value as JSON', () => {
    component.Data = [1, 2, 3];

    const scriptTag = document.getElementById('Data') as HTMLScriptElement;
    const stored = scriptTag.textContent || scriptTag.innerHTML;
    expect(stored).toEqual('[1,2,3]');
  });
});
