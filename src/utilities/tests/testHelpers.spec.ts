import { TestHelpers } from '../testHelpers';

describe('TestHelpers', () => {
  it('should return mocks needed to test a page', () => {
    const pageMocks = TestHelpers.GetComponentMocks();

    expect(pageMocks.mockDocument).toBeDefined();
    expect(pageMocks.mockApp).toBeDefined();
    expect(pageMocks.mockRouter).toBeDefined();
    expect(pageMocks.mockRoute).toBeDefined();
  });
});
