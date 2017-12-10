# A proposal: use Elixir-style modules in functional JavaScript

Moving your code towards a more functional style can have a lot of benefits - it
can be easier to reason about, easier to test, more declarative, and more. One
thing that often seems to come out worse in the move to FP, though, is
organization. In Object Oriented Programming, classes are a pretty useful unit
of organization - methods have to be in the same class as the data they work on,
so your code is pushed towards being organized in pretty logical ways.

In a modern Javascript project, however, things are often a little less
clear-cut. You often build you application around framework constructs like
components, services, and controllers. This framework code is often a stateful
class with a lot of dependencies. So, being a good functional programmer, you
pull your business logic out into small pure functions, and then compose them
together in your component to transform some state. Now you can test them in
isolation, and all is well with the world.

But where do you put them?

## Common patterns

The first answer is often "at the bottom of the file". You've got your main
component class or whatever, say `UserComponent.js`, and a couple pure helper
functions and the bottom of the file. Maybe you export them to you can test them
in `UserComponent.spec.js`.

Then as time goes on, you add a few more functions. Now the component is a few
months old, the file is 300 lines long, and it's more pure functions than it is
component. It's clearly time to split things up. So hey, if you've got a
`UserComponent`, why not toss those functions into a `UserComponentHelpers.js`
or something? Now your component file looks a lot cleaner, just importing the
functions it needs from the helper. You can test those used functions, and treat
the other ones basically like private methods.

So far so good - though that `UserComponentHelpers` file is kind of a grab-bag
of functions. You've got `fullName(user)` sitting next to `formatDate(date)`.

And then you get a new story to show users' full names in the navbar. Okay, so
now you're going to need that `fullName` function in two places. Maybe toss it
in a generic `utils` file? That's not great. And _then_, a few months later,
you're looking at the `FriendsComponent`, and find out someone else had already
implemented `fullName` in there. Oops. So now the next time you need a
user-related function, you check to see if there's one already implemented. But
to do that, you have to check at least `UserComponent`, `UserComponentHelpers`,
and `FriendsComponent`, and also `UserApiService`, which is doing some `User`
conversion.

So at this point, you may find yourself yearning for the days of classes, where
a `User` would handle figuring out it's own `fullName`. Happily, we can get the
best of both worlds by borrowing from functional languages like Elixir.

## Modules in Elixir

Elixir has a concept called structs. There's not unique to the language, but it
sets them up in a particularly useful way. Files generally have a single module,
which holds some functions. Modules also can have a single struct defined for
them, which is a list of fields associated with that module name. So a User
module might look something like this:

```elixir
defmodule User do
  defstruct [:first_name, :last_name, :email]

  def full_name(user = %User{}) do
    "#{user.first_name} #{user.last_name}
  end
end
```

Even if you're never seen any Elixir before, that should be pretty easy to
follow. There's a user struct (written as `%User{}` when used) that has a first
name, last name, and email. There's also a related `full_name` function that
takes a `User`, and operates on it. Looking at this, it's clear that the module
is organized like a class - we can define the data that makes up a user, and
then some logic that operates on `User`s, all in one place. But, we get all that
without the cognitive overhead of mutable state.

## Modules in JavaScript

So that's Elixir, but there's no reason we can't use the same pattern in
JavaScript-land. Instead of organizing your pure functions around the components
they're used in, you can organize them around the data types (or domain objects
in Domain Driven Design parlance) that they work on.

So, you can gather up all the user-related pure functions, from any component,
and put them together in a user module. That's helpful, but both a class and an
elixir module define their data structure, as well as their logic. In
JavaScript, there's no built-in way to do that.

That's where something like TypeScript comes in. With Typescript, you can define
interfaces and types, which describe the shape of objects and other pieces of
data in your application. So now we can re-create that same `User` module in
TypeScript:

```typescript
// user.ts
export interface User {
  firstName: string;
  lastName: string;
  email: string;
}

export function fullName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}
```

```typescript
// user.component.ts
import { User, fullName } from './user';

class UserComponent {
  name(): User {
    return fullName(this.user);
  }
}
```

You could do something very similar with Facebook's Flow, or any other library
that lets you define the shape of your data. If you're not using a type system,
you could skip all that and consider just leaving a comment, something like:

```javascript
/*
User: firstName, lastName, email
*/

export function fullName(user) {
  return `${user.firstName} ${user.lastName};
}
```

However you define your data, the key part is to put a definition of the data
next to the logic on the data in the same place. That way it's clear where your
functions should go, and where to look for them later. Also, since all your
user-specific logic is in once place, you'll probably be able to find some
shared logic to pull out that might not have been obvious if it was scattered
all over your codebase.

## Types other than a single interface

Sometimes, your data isn't described by a simple interface. Maybe you've got a
bunch of functions that all work on first names - pulling out the first letter,
or picking a nickname, or whatever. Even though the type they're all working on
is just `string`, it would still make sense to put them in the name `name.js`
module. In Elixir, it's common to declare type aliases for primitives, just to
help your types be more meaningful. You could do the same thing here, something
like:

```typescript
export type Name = string;

export function firstLetter(name: Name): string {...}
export function nickname(name: Name): string {...}
```

Or maybe you've got a bunch of functions that work on `[firstName, lastName]`
pairs. That would probably be better modeled as an object, but if pairs are
convenient, then declaring that as a type in a module is a fine idea:

```typescript
export type NamePair = [string, string];

export function fullName(name: NamePair): string {
  return `${name[0]} ${name[1]}`;
}
```

Finally, you'll sometimes want to export more then one type from a module. If a
lot of your functions return the same type, declaring that type in the module
could make sense. Also, the JavaScript objects your application passes around
often end up being nested data, and it might make sense to declare the subparts
as their own interfaces.

So if your users were structured like this:

```typescript
export interface User {
  email: string;
  name: {
    firstName: string;
    lastName: string;
  };
}
```

Then maybe a module like this would be reasonable:

```typescript
// user.ts
export interface User {
  email: string;
  name: Name;
}

export interface Name {
  firstName: string;
  lastName: string;
}

export function fullName(user: User): string {
  return `${user.name.firstName} ${user.name.lastName}`;
}
```

On the other hand, that `fullName` function is now really just working on
`Name`s. Pulling `Name` and `fullName` into their own module, and maybe just
using `Name.fullName` in `User.fullName`, could make sense too. It would depend
on if any other types (like `Friend`s) had `Name`s, and how much `Name`-related
code you have.

## Placing Parameters

It's good practice to always put the module's data type in a consistent position
in your functions - either always the first parameter, or always the last if
you're doing a lot of currying. It's both helpful just to have one less decision
to make, and it helps you figure out where things go - if it feels weird to put
`user` in the primary position, then the function probably shouldn't go into the
`User` module.

Functions that deal with converting between two types - pretty common in
functional programming - would generally go into the module of the type being
passed in - `userToFriend(user, friendData)` would go into the User module. In
Elixir it would idiomatic to call that `User.to_friend`, and if you're okay with
using wildcard imports, that'll work great:

```javascript
import * as User from 'accounts/User';

User.toFriend(user):
```

On the other hand, if you're following the currently popular JavaScript practice
of doing individual imports, then calling the function `userToFriend` would be
more clear:

```javascript
import { userToFriend } from 'accounts/User';

userToFriend(user):
```

## Consider wildcard imports

However, I think that with this functional module pattern, wildcard imports make
a lot of sense. They make you prefix your functions with the type they're
working on, which keeps things clear. They also push you to think of the
collection of `User`-related types and functions as one thing, like a class.

But if you do that and declare types, one issue is that then in other classes
you'd be referring to the type `User.User`. Yuck. There's another idiom we can
borrow from Elixir here - when declaring (optional) types in that language, it's
idiomatic to name the module struct's type `t`.

That works just fine in TypeScript, and it's nice and readable. You use `t` to
describe the type of the current module, and `Module.t` to describe the type
from `Module`.

```typescript
// user.ts
export interface t {
  firstName: string;
  lastName: string;
  email: string;
}

export function fullName(user: t): string {
  return `${user.firstName} ${user.lastName}`;
}
```

```typescript
// user.component.ts
import * as User from './user';

class UserComponent {
  name(): User.t {
    return User.fullName(this.user);
  }
}
```

It does, however, break a popular rule from the TypeScript
[Coding Guidelines](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)
to "use PascalCase for type names." You could name the type `T` instead, but
then that would conflict with the common TypeScript practice of naming the
generic type `T`. Overall, `User.t` seems like a nice compromise, and the
lowercase `t` feels like it keeps the focus on the module name, which is the
_real_ name of the type anyway. This is one for your team to decide on, though.

## Composing Functions

However you import these function, in your application you'll end up chaining a
bunch of them together. As much as possible, it's nice to keep that logic in
other functional modules. So you might have `User` and `Token` modules and then
a `ForgotPassword` module for fetching a token for a user and comparing it to
one from a form field.

Then, your framework-specific `forgotPassword` component or reducer just has to
pull together the user and form state, and call out to your functional modules.

That's not to say that your components won't have any logic other than composing
together functions. A component is still probably the right place for any
view-specific logic, and any stateful code will have to go somewhere other than
a functional module.

## Wrapping up

But decoupling your business logic from your framework keeps it nicely organized
and testable, makes it easier to onboard developers who don't know your specific
framework, and means you don't have to be thinking about controllers or reducers
when you just want to be thinking about users and passwords.

And this process doesn't have to happen all at once. Try pulling all the logic
for just one module together, and see how it goes. You may be surprised to find
how much duplication you find!

So in summary:

* Try organizing your functional code by putting functions in the same modules
  and the types they work on
* Put the module's data parameter in a consistent position in your function
  signatures
* Consider using `import * as Module` wildcard imports, and naming the main
  module type `t`
