# Put some curry on your console.log

These days I’ve been writing a lot more functional javascript, using tools like
RxJS and ramda. They allow for beautiful, declarative pipelines of functions,
like

```javascript
// RxJS
clickObservable
  .filter(isGood)
  .map(toThing)
  .flatMap(saveThing(apiService))
  .delay(100)
  .subscribe(setThing);
```

```javascript
// ramda
R.pipe(R.filter(isGood), R.map(toThing), R.groupBy(thingType(types)))(data);
```

```javascript
// lodash/fp
_.flow(_.filter(isGood), _.map(toThing), _.groupBy(thingType(types)))(data);
```

The one problem I've been running into with pipelines is debugging - I'll have a
test tell me a pipeline is outputting unexpected data, but I'm not sure where
the problem is.

For instance, let's say you're writing a function to get the average area of a
list of triangles. Each triangle is represented as an array of `[height,
width]`. Knowing the formula for the area of a triangle is `width * height / 2`,
you write a little pipeline function like this:

```javascript
const multiplySides = R.reduce(R.multiply, 1);
const divideByTwo = R.divide(2);

const averageTriangle = R.pipe(
  R.map(multiplySides),
  R.map(divideByTwo),
  R.mean
);
```

Nice and clean, looks reasonable. Then you try testing the code:

```javascript
expect(averageTriangle([[2, 4], [3, 3], [4, 8]])).toBeCloseTo(8.167, 3);
```

Aaaaand `Expected 0.17824074074074073 to be close to 8.167`. Boo.

So at this point, what I want to do is put a `console.log` after every step, and
see how the data is changing along the pipeline. That's easy enough; ramda has
`tap` (and RxJS has `.do`). They both let you pass a function that'll perform a
side effect, but then will return the original value. That lets us do something
like:

```javascript
const averageTriangle = R.pipe(
  R.map(multiplySides),
  R.tap(console.log),
  R.map(divideByTwo),
  R.tap(console.log),
  R.mean
);
```

So now when we run our test, we get some extra output:

```txt
LOG: [8, 9, 32]
LOG: [0.25, 0.2222222222222222, 0.0625]
Chrome 62.0.3202 (Mac OS X 10.12.6) averageTriangle calculates the average area FAILED
```

Well okay, that's probably enough to debug the problem, but it'd be nice to be
able to tag those logs so it's easy to see what step they're referring to.
Javascript lets you pass multiple arguments to `console.log`, but then we can't
just pass `console.log` as a callback anymore, we'd have to do something like
this:

```javascript
const averageTriangle = R.pipe(
  R.map(multiplySides),
  R.tap(data => console.log('mult', data)),
  R.map(divideByTwo),
  R.tap(data => console.log('div', data)),
  R.mean
);
```

That's fine, but typing those fat arrow functions, so annoying! Happily, there's
a solution for the lazy programmer - a curried console.log.

On my last project, we added a tiny helper function for this very problem.

```javascript
// Javascript
export const log = (...args) => data => {
  console.log.apply(null, args.concat([data]));
  return data;
};
```

```typescript
// Typescript
export const log = (...args: any[]) => <T>(data: T): T => {
  console.log.apply(null, args.concat([data]));
  return data;
};
```

`log` takes any number of arguments to tag your log with, and then a last
argument that's your actual data, passes it all to `console.log`, and returns
the original data. So now we can really clean up our code, to just:

```javascript
const averageTriangle = R.pipe(
  R.map(multiplySides),
  R.tap(log('mult')),
  R.map(divideByTwo),
  R.tap(log('div')),
  R.mean
);
```

But wait, `log` takes a value, does a side effect with it, and then returns a
value. That sounds like `tap`! And indeed, we can drop the calls to `tap`, and
just use `log` directly:

```javascript
const multiplySides = R.reduce(R.multiply, 1);
const divideByTwo = R.divide(2);

const averageTriangle = R.pipe(
  R.map(multiplySides),
  log('mult'),
  R.map(divideByTwo),
  log('div'),
  R.mean
);
```

Nice. And now looking at the test output, we see it's definitly the division
step that's failing:

```txt
LOG: 'mul', [8, 9, 32]
LOG: 'div', [0.25, 0.2222222222222222, 0.0625]
Chrome 62.0.3202 (Mac OS X 10.12.6) averageTriangle calculates the average area FAILED
        Expected 0.17824074074074073 to be close to 8.167, 3.
```

And indeed, it turns out that ramda's `divide` function takes the numerator as
the first argument, while we're trying to pass it the denominator, `2`. So

```javascript
const divideByTwo = R.divide(2);
```

should be

```javascript
const divideByTwo = R.flip(R.divide)(2);
```

And now our test reports success!

```txt
LOG: 'mult', [8, 9, 32]
LOG: 'div', [4, 4.5, 16]
Chrome 62.0.3202 (Mac OS X 10.12.6): Executed 4 of 4 SUCCESS (0.124 secs / 0.115 secs)
```

`log` also works well with RxJS's `.do` method:

```javascript
triangleObservable
  .do(log('triangles'))
  .map(averageTriangle)
  .do(log('average'));
```

So there you go! A handy way to inject some loggers into functional pipelines
with a minimum of boilerplate.
