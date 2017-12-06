# Dialyzer

Elixir is a great compromise language - it combines the friendly syntax and easy
of use of Ruby with immutability and pattern matching from the functional world,
and the stability and concurrency of Erlang/OTP. But if you're familiar with
typed FP from Haskell or ML languages like OCaml or F#, you may find yourself
missing types. Dialyzer is another great compromise - it helps you think with
types, without losing the flexibility of a dynamic type system.

[Dialyzer](http://erlang.org/doc/man/dialyzer.html) is a static analysis tool
for Erlang that reports type errors it finds in your code. With
[dialyxir](https://github.com/jeremyjh/dialyxir), it's easy to use on your
Elixir Mix project too. It can run on standard untyped Elixir code, but works
even better when you add type hints to your functions, called
[typespecs](https://hexdocs.pm/elixir/typespecs.html).

Here's the premise - unlike the Hindley–Milner type system from the ML world, or
standard OO type systems like in Java, Dialyzer uses Success Typing. Basically,
instead of proving to the compiler that your program is correct, Dialyzer will
report an error only if it can prove that your program is always incorrect. As
long as there's some path through the code that seems reasonable, it won't
complain. So if you know in your heart that your function works, you don't have
to spend time explaining yourself to a compiler.

## Simple Types

So if you've got some function that can double either a number or a string, like
this:

```elixir
def double(n) when is_number(n), do: n + n
def double(string), do: string <> string
```

Some compilers might not be able to puzzle out if, given a number, they should
expect back a string or number - though cleverer ones could. Dialyzer is fine
with it, and will ferret out what will definitely not work:

```elixir
# The call 'MyModule':double([]) will never return since it differs in the 1st argument from the success typing arguments: (binary() | number()
double([])

# The call erlang:tuple_to_list(binary() | number()) will never return since it differs in the 1st argument from the success typing arguments: (tuple())
Tuple.to_list(double(1))
```

While leaving alone things that definitely will work:

```elixir
double(1) + 1
double("foo") <> "foo"
```

Pretty nice - we get typechecking on our dynamic code. However with success
typing, as long as something _might_ work, dialyzer won't complain:

```elixir
# Will throw (ArithmeticError) bad argument in arithmetic expression at runtime
double(1) <> "foo"
```

Still, for the most part dialyzer will find problems, even if you can't rely on
it as much. But there's more to typed FP than catching simple errors, and
typespecs and dialyzer can help there too.

## Checked documentation

Elixir includes typescpecs, a way of documenting the types of your functions.
All the standard library code includes typespecs, and it's a useful way to
quickly see how to use a function. The syntax is pretty simple, and looks like
this:

```elixir
@spec double(number | String.t()) :: number | String.t()
def double(n) when is_number(n), do: n + n
def double(string), do: string <> string
```

Since Dialyzer is pretty good at infering types itself, it's also
good at checking any typespecs you gi
