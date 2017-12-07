# Taking advantage of types in Elixir

Elixir is a great compromise language - it combines the friendly syntax and easy
of use of Ruby with immutability and pattern matching from the functional world,
and the stability and concurrency of Erlang/OTP. But if you're familiar with
typed FP from Haskell or ML languages like OCaml or F#, you may find yourself
missing types. Elixir [typespecs](https://hexdocs.pm/elixir/typespecs.html) are
another great compromise - they help you think with types, without losing the
flexibility of a dynamic type system.

You can't talk about typespecs withuot talking about
[Dialyzer](http://erlang.org/doc/man/dialyzer.html). It's a static analysis tool
for Erlang that reports type errors it finds in your code. With
[Dialyxir](https://github.com/jeremyjh/dialyxir), it's easy to use on your
Elixir Mix projects too. It can run on and find problems with standard untyped
Elixir code , but it will also verify your typespeces.

Here's the premise - unlike the Hindley–Milner type system from the ML world, or
standard OO type systems like in Java, Dialyzer uses Success Typing. Basically,
instead of proving to the compiler that your program is correct, Dialyzer will
report an error only if it can prove that your program is always incorrect. As
long as there's some path through the code that seems reasonable, it won't
complain. So if you know in your heart that your function works, you don't have
to spend time explaining yourself to a compiler.

## Dialyzer in action

So let's say you've got some function that can double either a number or a
string, like this:

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
it as much as a more sound type system. But there's more to typed FP than
catching simple errors, and typespecs and dialyzer can help there too.

## Checked documentation

Even before you get into type theory, typespecs are great as documentation. All
the standard library code includes typespecs, and they're a useful way to
quickly see how to use a function. But unlike standard documentation or
comments, since Dialyzer can infer types, it can warn us when our typespecs
don't match up with our code.

The syntax is pretty simple, and looks like this:

```elixir
@spec double(number | String.t()) :: number | String.t()
def double(n) when is_number(n), do: n + n
def double(string), do: string <> string
```

Typespecs start with `@spec function_name`, then have the types of any
parameters in parentheses, then the return type after two colons. If you list
the parameters you're required to list the return type too, but you can always
opt out of committing to typing something with the `any` type.

Union types, which describe things that can be multiple types, are created by combining the types with a `|`, liek with `(number | String.t)`.
