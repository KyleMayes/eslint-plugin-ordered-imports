// SPDX-License-Identifier: Apache-2.0

import { RuleTester } from "eslint";

import { Input } from "./input";
import { rule } from "./rule";

const groups: Input["group-order"] = [
  { name: "parent directories", match: "^\\.\\.", order: 20 },
  { name: "current directory", match: "^\\.", order: 30 },
  { name: "third-party", match: ".*", order: 10 },
];

const tester = new RuleTester({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
  },
});

tester.run("ordered-imports", rule, {
  valid: [
    // "specifier-order": "any"
    {
      options: [{ "specifier-order": "any" }],
      code: `import { c, b, a, C, B, A } from "a";`,
    },

    // "source-order": "any"
    {
      options: [{ "source-order": "any" }],
      code: `
import c from "c";
import b from "b";
import a from "a";
import C from "C";
import B from "B";
import A from "A";
      `,
    },
  ],
  invalid: [
    // "specifier-order": "lowercase-last"
    {
      code: `import { c, b, a, C, B, A } from "a";`,
      output: `import { A, B, C, a, b, c } from "a";`,
      errors: [
        { message: "unordered import specifier" },
        { message: "unordered import specifier" },
        { message: "unordered import specifier" },
        { message: "unordered import specifier" },
        { message: "unordered import specifier" },
        { message: "unordered import specifier" },
      ],
    },

    // "specifier-order": "case-insensitive"
    {
      options: [{ "specifier-order": "case-insensitive" }],
      code: `import { c, b, a, C, B, A } from "a";`,
      output: `import { a, A, b, B, c, C } from "a";`,
      errors: [
        { message: "unordered import specifier" },
        { message: "unordered import specifier" },
        { message: "unordered import specifier" },
        { message: "unordered import specifier" },
        { message: "unordered import specifier" },
        { message: "unordered import specifier" },
      ],
    },

    // "source-order": "lowercase-last"
    {
      code: `
import c from "c";
import b from "b";
import a from "a";
import C from "C";
import B from "B";
import A from "A";
      `,
      output: `
import A from "A";
import B from "B";
import C from "C";
import a from "a";
import b from "b";
import c from "c";
      `,
      errors: [
        { message: "unordered import source" },
        { message: "unordered import source" },
        { message: "unordered import source" },
        { message: "unordered import source" },
        { message: "unordered import source" },
        { message: "unordered import source" },
      ],
    },

    // "source-order": "case-insensitive"
    {
      options: [{ "source-order": "case-insensitive" }],
      code: `
import c from "c";
import b from "b";
import a from "a";
import C from "C";
import B from "B";
import A from "A";
      `,
      output: `
import a from "a";
import A from "A";
import b from "b";
import B from "B";
import c from "c";
import C from "C";
      `,
      errors: [
        { message: "unordered import source" },
        { message: "unordered import source" },
        { message: "unordered import source" },
        { message: "unordered import source" },
        { message: "unordered import source" },
        { message: "unordered import source" },
      ],
    },

    // "groups" (order)
    {
      options: [{ "group-order": groups }],
      code: `
import a30 from "./a";
import b30 from "./b";

import a10 from "a";
import b10 from "b";

import a20 from "../a";
import b20 from "../b";
      `,
      output: `
import a10 from "a";
import b10 from "b";

import a20 from "../a";
import b20 from "../b";

import a30 from "./a";
import b30 from "./b";
      `,
      errors: [
        { message: "unordered import group" },
        { message: "unordered import group" },
        { message: "unordered import group" },
      ],
    },

    // "groups" (unmerged)
    {
      options: [{ "group-order": groups }],
      code: `
import a10 from "a";

import b10 from "b";

import a20 from "../a";

import b20 from "../b";

import a30 from "./a";

import b30 from "./b";
      `,
      errors: [
        { message: "unmerged import group" },
        { message: "unmerged import group" },
        { message: "unmerged import group" },
      ],
    },

    // "groups" (members)
    {
      options: [{ "source-order": "any", "group-order": groups }],
      code: `
import a10 from "a";
import b30 from "./b";

import a20 from "../a";
import b10 from "b";

import a30 from "./a";
import b20 from "../b";
      `,
      errors: [
        { message: "invalid import group member" },
        { message: "invalid import group member" },
        { message: "invalid import group member" },
      ],
    },
  ],
});
