# eslint-plugin-ordered-imports

![](https://github.com/KyleMayes/eslint-plugin-ordered-imports/workflows/CI/badge.svg)

An ESLint rule for sorting and grouping imports.

Released under the Apache License 2.0.

## Usage

Install the `eslint-plugin-ordered-imports` package and add `ordered-imports` to
the `plugins` section of your `.eslintrc` file. Optionally, add
`plugin:ordered-imports/recommended` to the `extends` section of your
`.eslintrc` file to enable the recommended configuration. For example, here are
the sections of an `.eslintrc` file where both of these actions have been taken.

```js
{
  plugins: ["ordered-imports"],
  extends: ["plugin:ordered-imports/recommended"],
}
```

### Configuration

There is only one rule exposed by this plugin, `ordered-imports`. This rule has
three configuration options which may be configured or left with their default
values: `declaration-ordering`, `specifier-ordering`, and `group-ordering`. Here
is the structure of the rule configuration defined in TypeScript.

```ts
type Type = "side-effect" | "default" | "namespace" | "destructured";

type Configuration = {
  // Defines how import declarations are ordered.
  // Default = `["source", "lowercase-last"]`
  "declaration-ordering"?:
    // Unordered.
    | ["any"]
    // Ordered by import name (e.g., the `foo` in `import foo from "bar"`).
    | ["name", "case-insensitive" | "lowercase-last"]
    // Ordered by import source (e.g., the `bar` in `import foo from "bar"`).
    | ["source", "case-insensitive" | "lowercase-last"]
    // Ordered by import type which is a category defined by this plugin.
    //
    // * "side-effect" (e.g., `import "foo"`)
    // * "default" (e.g., `import foo from "bar"`)
    // * "namespace" (e.g., `import * as foo from "bar"`)
    // * "destructured" (e.g., `import { foo, bar } from "baz"`)
    //
    // After being ordered by import type, the imports within each subgroup with
    // the same import type may then be ordered.
    | ["type", {
        // Defines how subgroups with the same import type are ordered.
        // Default = `["side-effect", "default", "namespace", "destructured"]`
        ordering?: [Type, Type, Type, Type];
        // Defines how import declarations within each subgroup are ordered.
        // Default = `["source", "lowercase-last"]`
        secondaryOrdering?:
          // Unordered.
          | ["any"]
          // Ordered by import name (e.g., the `foo` in `import foo from "bar"`).
          | ["name", "case-insensitive" | "lowercase-last"]
          // Ordered by import source (e.g., the `bar` in `import foo from "bar"`).
          | ["source", "case-insensitive" | "lowercase-last"];
      }];
  // Defines how import specifiers are ordered.
  // Default = `"lowercase-last"`
  "specifier-ordering"?: "case-insensitive" | "lowercase-last" | "any";
  // Defines how import groups are ordered.
  // Default = `[]`
  "group-ordering"?: { name: string; match: string; order: number }[];
};
```

Here is the recommended configuration (provided by
`plugin:ordered-imports/recommended` mentioned in the `Usage` section) as it
would appear in `.eslintrc` with all options fully specified (no default
values):

```js
{
  rules: {
    "ordered-imports/ordered-imports": [
      "error",
      {
        "declaration-ordering": ["type", {
          ordering: ["side-effect", "default", "namespace", "destructured"],
          secondaryOrdering: ["name", "lowercase-last"],
        }],
        "specifier-ordering": "lowercase-last",
        "group-ordering": [
          { name: "project root", match: "^@", order: 20 },
          { name: "parent directories", match: "^\\.\\.", order: 30 },
          { name: "current directory", match: "^\\.", order: 40 },
          { name: "third-party", match: ".*", order: 10 },
        ],
      },
    ],
  },
}
```

Note the ordering of the groups in the `group-ordering` configuration. An import
declaration is considered a member of the first group whose regular expression
(the `match` property) matches the source of the import declaration (e.g., the
`bar` in `import foo from "bar"`). As a result, the `"third-party"` import group
has been defined last because its regular expression matches every import
declaration.
