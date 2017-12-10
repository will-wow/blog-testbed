# Static Signal Graphs in Angular

Here at Carbon Five, we've had a number of projects this year where we heavily
used RxJS, a reactive stream library. // TODO: RxJS is...

One pattern we've found useful is having a Static Signal Graph. Here's the
premise: you model most of your business logic as a large graph of Observable
streams, all set up on application start. Subjects allow you to put events into
the graph, and then various other Observables derive from those primary streams
or each other, transforming them, combining them, and fetching data
asynchronously. Your components can pick any point in the graph to subscribe to,
and can consume that data without knowing if it's a primary stream, or at the
end of a chain of observables.

Here, we're going to see both how a static signal graph works, and how to set
one up in Angular.
