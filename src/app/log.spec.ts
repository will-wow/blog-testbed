import { averageTriangle } from './testbed';

describe('averageTriangle', () => {
  it('calculates the average area', () => {
    expect(averageTriangle([[2, 4], [3, 3], [4, 8]])).toBeCloseTo(8.167, 3);
  });
});
