import { Asap } from '../asap';

describe('Asap', () => {
  it('should return a successful result after completing a function', async () => {
    let val = false;
    await Asap(() => val = true);
    expect(val).toEqual(true);
  });
});
