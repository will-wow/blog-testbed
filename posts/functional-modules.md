# Learning from Elixir to organize functional projects in JS

Moving your code towards Functional Programming can have a lot of benefits - it
can be easier to reason about, easier to test, more declarative, and more. One
thing that often seems to come out worse in the move to FP, though, is
organization. In Object-Oriented Programming, classes are a pretty useful unit
of organization - methods have to be in the same class as the data they work on,
so your code is pushed towards being organized in pretty logical ways.

In a modern Javascript project, however, things are often a little less
clear-cut. You often build you application around framework constructs like
components, services, controllers, etc. This framework code is often a stateful
class with a lot of dependencies. So, being a good functional programmer, you
pull your business logic out into small pure functions, and then compose them
together in your component to transform some state or whatever. Now you can test
them in isolation, and all is well with the world.

But where do you put them?

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

So far so good - but that `UserComponentHelpers` file is kind of a grab-bag of
functions. You've got `fullName(user)` (which combines the user's first, last
and middle names) sitting next to // TODO MORE EXAMPLES

And then you get a new story to show users' full names in the navbar. Okay, so
now you're going to need that `fullName` function in two places. Maybe toss it
in a generic `utils` file? That's not great. And _then_, a few months later,
you're looking at the `FriendsComponent`, and find out someone else had already
implemented `fullName` in there. Oops. So now the next time you need a
user-related function, you check to see if there's one already implemented. But
to do that, you have to check at least `UserComponent`, `UserComponentHelpers`,
`FriendsComponent`, and also `UserApiService`, which is doing some `User`
conversion.

So at this point, you may find yourself yearning for the days of classes, where
a `User` would handle figuring out it's own `fullName`. Happily, we can get the
best of both worlds by borrowing from functional langagues like Elixir.

Elixir, a functional langage that's been growing in popularity, has a concept
called structs. There's not unique to the language, but there's set up in a
particularly useful way. Most files have a single module, which holds some
functions. Modules also can have a single struct defined for them, which is a
list of fields associated with that module name. So a User module might look
something like this:

```elixir
defmodule User do
  defstruct [:first_name, :last_name, :email]

  def full_name(user = %User{}) do
    "#{user.first_name} #{user.last_name}
  end
end
```

Even if you're never seen any Elixir before, that should be pretty easy to
follow. There's a user struct (displayed as `%User{}` in code) that has a first
name, last name, and email. There's also a related full_name function that takes
a User, and operates on it. Looking at this, it's clear that the module should
be organized like a class - we can define the data that makes up a user, and
then some logic that operates on `User`s, all in one place.

So that's Elixir, but there's no reason we can't use the same patten in
JavaScript-land. Instead of organizing you pure functions around the components
they're used in, you can organize them around the data types (or domain objects
in Domain Drivien Design parlance) that they work on.

So, you can gather up all the user-related pure functions, from any component,
and put them together in a user module. That's helpful, but both a class and an
elixir module define their data, as well as their logic. In JavaScript, there's
no built-in way to do that.

Functional projects often end up with grab-bags of pure functions Like
component.helpers.ts How to better organize? Types! Have a module define a main
interface Name it the same as the module Put any functions that operate on the
type in the module Be consistent with either always taking the data as the first
argument, or the last one if you’re using a lot of currying This gets you the
benefits of grouping data and logic, like with OOP, but without the cognitive
overhead of mutable state This is the normal way to do things in languages like
Elixir and Go, that have Structs What about functions that convert from one type
to another This is a common operation in FP If you put the function in the
module of the type being converted from, you can call it Type.to_other_type,
which is nice Except that the current trend is to import individual functions,
and if you just have a to_other_type, it’s not obvious what the first type was
One nice pattern from OCaml is to call them “type_2_of_type_1” It’s unambiguous,
and easy to grep for - if you know both types, you can find a conversion
function (if it exists) Composing function Of course, this is FP, so in the end
you’ll be composing functions that work on different types into pipelines of
logic. So where do those compositions go? Their own modules named by
feature/context You might have a User and Token modules for users and comparing
tokens, and then a ForgotPassword module for fetching a token from a user and
comparing it to one from the UI The last step of composition is probably going
to happen in your framework files, like components and controllers See Baby In A
Corner
