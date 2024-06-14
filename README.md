# Transcript

## Motivation

In 2020, the Corona pandemic hit Europe. The "Internationale Brettspielmesse in Essen",
which is a major international board-game convention, could not take place in their usual halls.
The organizer was looking for someone to implement an online version, and we were lucky enough
to get the job.

As is usual in web-frontend with international users, we needed some kind of i18n-features
and user `react-i18next` to implement this. In most frameworks that implement such features,
the actual translations are stored in json-files, one for each language.

```json
{
  "title": "Willkommen",
  "greeting": "Hallo {username}",
  "nextGame": "Nächstes Spiel: {player1} gegen {player2}"
}
```

And most provide a t-function (i.e. "translate") to access the text in the current language.
The signature of a naive t-function, in TypeScript, look like this:

```typescript
export function t(key: string, param?: Record<string, string>): string {
  /* do something */
}
```

This works fine for small amounts of text, but if you have 1000 keys in you translations,
you wish for some IDE support, which we can get through TypeScript, because...

*...TypeScript can do Strings!*

What exactly do we want to achieve?

1. In the example above `t("titl")` should show an error, because `titl` is not a valid key. 
   Typos happen all the time and we don't want to wait until the UI has reloaded of the tests 
   have failed, before we notice something is wrong.
2. It would also be very neat to have an error for `t("greeting", {user: "Max"}`, because
   even though `greeting` is correct, the parameter should be called `username` and not `user`.

In this talk, we will see how this is possible to tell TypeScript what is valid. The nice 
thing is, that we even get auto-completion and have to type less.

But in order to do that, we need to know some basics about TypeScript features that may be
lesser known by the ordinary developer.

## Basic string types

We start with basic types. Of course, the most basic `string`-type is `string` itself.

```typescript
// Error
const myString1: string = 2;

// Correct
const myString2: string = "some string";
```

## String literal types and union types

This is nothing new, but we can also specify `string literal types`.
Those are types where exactly one value can be specified.

```typescript
// Correct
const foo1: "foo" = "foo";

// Invalid
const foo2: "foo" = "bar";
```

Having such a type might not seem very useful: What's the need if you can only store one single value.
But at least of get auto-completion for that value with IntelliSense, which is pretty cool

More reasonable seems to be the combination with union types. A `union type` specifies multiple alternative
values that can be used in a variable, not only for strings. Together with `string literal types` they are
a nice alternative to enumerations

```typescript
// Correct
const fooBar1: "foo" | "bar" = "foo";

// Also correct
const fooBar2: "foo" | "bar" = "bar";
```

Of course, we can always store types in Type Aliases

```typescript
type FooBar = "foo" | "bar";
const foobar: FooBar = "bar";
```

## Deriving types from objects

In the example of the talk, we want to derive the correct translation keys to be used,
which happen to be the keys of the translation-object (en.json).
In the SPIEL.digital project, we actually wrote that interface by hand (or generated it once and then maintained it.)
You can then derive the type of the key by using `keyof`

```typescript
interface TranslationSchema {
  title: string;
  greeting: string;
}

type TranslationKey = keyof TranslationSchema;

// Correct
const key1: TranslationKey = "title";

// Invalid
const key2: TranslationKey = "unkownKey";
```

It does not make sense to just use variables of that type, but now we can also use it as parameter in out t-function.
Then, our first goal is already achieved: We can only call the function with valid parameters. And we get auto-completion

```typescript
function t(key: TranslationKey, params?: Record<string, string>): string {
  return "the correct translation";
}

// Correct
t("title");

// Invalid
t("unknownKey");
```

# Infering Template literal types

In order to perform parameter validation, we need two other techniques: `infer` and `template literal types`

Template literal types allow us to define strings patterns that are allows. Not as powerful as regular expression,
but very helpful.

```typescript
type IsoDate = `${number}-${number}-${number}`;

// Correct
const isoDate1: IsoDate = "2012-02-24";

// Invalid
const isoDate2: IsoDate = "Januar";
```

The real power however comes from the combination with `extends` and `infer`.
The following snippet checks whether a string type matches a pattern and infers parts of the string as type.
Specifically, the part inside curly braces is extracted:

```typescript
type ExtractParam<T extends string> =
  T extends `${string}{${infer Param}}${string}` ? Param : never;
// To make it better readable, without ${}
// ------------------------------------------------string { infer Param  }  string -----------------

// Correct
const param1: ExtractParam<"{player1} vs {player2}"> = "player1";

// Invalid
const param2: ExtractParam<"{player1} vs {player2}"> = "player3";

// Sadly also invalid
const param3: ExtractParam<"{player1} vs {player2}"> = "player2";
```

`player2` is not possible as value for `param3` because the pattern matching goes from left to right.
After the first part in `{}` is found, the second is forgotten.
In order to find that as well, we need to define the type recursively and also analyze the rest of the string

```typescript
type ExtractParams<T extends string> =
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Param | ExtractParams<Rest>
    : never;

// Correct
const param1: ExtractParam<"{player1} vs {player2}"> = "player1";
const param2: ExtractParam<"{player1} vs {player2}"> = "player2";

// Invalid
const param3: ExtractParam<"{player1} vs {player2}"> = "player3";
```

## Deriving value types from an object

Before, we were deriving the type of the keys of an object, but we can also derive types for the values of a
given key, and if the value-type happens to be a string-literal type, we also get auto-completion here:

```typescript
interface Car {
  type: "car";
  size: number;
  name: string;
}

// Valid
const x1: Car["type"] = "car";
const y1: Car["size"] = 2;
const z1: Car["name"] = "Paula";

// Invalid
const x2: Car["type"] = "air-plane";
```

And the last missing puzzle piece is: We can also derive exact interfaces from real objects, including their values.
The `typeof` feature allows use to do that

```typescript
const en = {
  title: "Welcome",
  greeting: "Hello {username}",
};

type TranslationSchema = typeof en;

// Correct
const de: TranslationSchema = {
  title: "Willkommen",
  greeting: "Hallo {username}",
};

// Invalid
const de2: TranslationSchema = {
  // Invalid key
  unknown: "key",
  // title and greeting are missing
};
```

This derives the interface that we already specified above:

```typescript
interface TranslationSchema {
  title: string;
  greeting: string;
}
```

For our string analysis however, the type `string` as value does not help us. We need the literal type,
This can be achieved by the `as const` keyword, telling TypeScript that this object is not going to change
and that exact types should be derived.

```typescript
const en = {
  title: "Welcome",
  greeting: "Hello {username}",
} as const;

type TranslationSchema = typeof en;

// Invalid, only the exact strings from 'en' are valid
const de: TranslationSchema = {
  title: "Willkommen",
  greeting: "Hallo {username}",
};
```

This allows use to do further analysis with the `ExtractParams`-type that we defined above:

## Putting it all together

The first thing we have to do is to replace the JSON files by TypeScript files with `as const`. For the sake of
simplicity, we do it all in one file here. The `src/solution` folder contains a more realistic example.

This, we already have seen above:

```typescript
const en = {
  title: "Welcome",
  greeting: "Hello {username}",
} as const;

type TranslationSchema = typeof en;
type TranslationKey = keyof TranslationSchema;
type ExtractParams<T extends string> =
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Param | ExtractParams<Rest>
    : never;

// Load the translation via its key and extract parameters
type ExtractParamsForKey<T extends TranslationKey> = ExtractParams<
  TranslationSchema[T]
>;

// Extract the parameters from the translate value associated with our key and use them as key in our ParamsObject
type ParamObject<T extends TranslationKey> = Record<
  ExtractParamsForKey<T>,
  string
>;

// Define the t-function, deriving the params from the first parameter
export function t<T extends TranslationKey>(key: T, params: ParamObject<T>) {
  return "something";
}

// Correct
t("greeting", { username: "Max" });
t("title", {});

// Invalid
t("greeting", { user: "Max" });

// Sadly also invalid: Have a look at https://stackoverflow.com/q/78619236/4251384 to get a solution for that.
t("title");
```

## Exciting, but does it make sense?

We have now written about 17 lines of type definitions to achieve that goal. They are also
hard to understand. While I am amazed that such things are can be done with TypeScript,
and that they almost allow you to create a DSL using only types, I also realized that
such types are hard to debug, especially if they get even more complicated.

Have you ever tried to understand the vue.js types?

We have been using [oazapfts](https://github.com/oazapfts/oazapfts) to generate clients
for OpenAPI definitions. And similar things exist for GraphQL.

Code generators might also make sense to create the schema for translations. And they are
not hard to write. In the `src/solutions-codegenerator` directory, I have written one for our translations.
At least part of the logic can be extracted there, and we don't need to have `infer` and `extends`
anymore.

I don't know how yet this will feel in a production setting. It might be difficult to work with
automatic refactorings there.
