import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ReplaySubject } from 'rxjs/ReplaySubject';

// This adds a fake _type property to observables,
// so we can access the wrapped type in StreamWrapperMock.
declare module 'rxjs/Observable' {
  interface Observable<T> {
    readonly _type: T;
  }
}

declare module 'rxjs/Observable' {
  interface Subject<T> {
    readonly _type: T;
  }
}

declare module 'rxjs/Observable' {
  interface ReplaySubject<T> {
    readonly _type: T;
  }
}

declare module 'rxjs/Observable' {
  interface BehaviorSubject<T> {
    readonly _type: T;
  }
}

type Stream<T> =
  | Observable<T>
  | Subject<T>
  | ReplaySubject<T>
  | BehaviorSubject<T>;

export interface StreamWrapper<T extends Observable<any>> {
  $: T;
}

export class SubjectWrapper<T> implements StreamWrapper<Subject<T>> {
  $: Subject<T>;

  constructor() {
    this.$ = new Subject();
  }
}

export class BehaviorSubjectWrapper<T> implements StreamWrapper<Subject<T>> {
  $: BehaviorSubject<T>;

  constructor(value: T) {
    this.$ = new BehaviorSubject(value);
  }
}

export class ReplaySubjectWrapper<T> implements StreamWrapper<Subject<T>> {
  $: ReplaySubject<T>;

  constructor() {
    this.$ = new ReplaySubject(1);
  }
}

// A type for a mock StreamWrapper - it wraps the same type
// as the T passed in, but has no private properties and
// is a subject for easier testing.
export interface StreamWrapperMock<T extends StreamWrapper<Stream<any>>> {
  $: Subject<T['$']['_type']>;
}

export interface StreamWrapperReplayMock<T extends StreamWrapper<Stream<any>>> {
  $: ReplaySubject<T['$']['_type']>;
}

export interface StreamWrapperBehaviorMock<
  T extends StreamWrapper<Stream<any>>
> {
  $: BehaviorSubject<T['$']['_type']>;
}

/**
 * Generate a mock StreamWrapper in a test.
 */
export function mockStream<T extends Observable<any>>($: T): StreamWrapper<T> {
  return { $ };
}
