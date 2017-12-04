import { Observable } from 'rxjs/Observable';
import * as R from 'ramda';

export const log = (...args: any[]) => <T>(data: T): T => {
  console.log.apply(null, args.concat([data]));
  return data;
};

export const triangles = [[2, 4], [3, 3], [4, 8]];

const multiplySides = R.reduce(R.multiply, 1);
// const divideByTwo = R.divide(2);
const divideByTwo = R.flip(R.divide)(2);

export const averageTriangle = R.pipe(
  R.map(multiplySides),
  log('mult'),
  R.map(divideByTwo),
  log('div'),
  R.mean
);
