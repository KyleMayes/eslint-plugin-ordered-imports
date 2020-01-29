// SPDX-License-Identifier: Apache-2.0

import { RuleTester } from "eslint";

import { InputOptions } from "./options";
import { rule } from "./rule";

const groups: InputOptions["group-ordering"] = [
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
    // "declaration-ordering": ["any"]

    {
      options: [{ "declaration-ordering": ["any"] }],
      code: `
import e from "e";
import { b, c, d } from "bcd";
import a from "a";
      `,
    },

    // "declaration-ordering": ["name", ?]

    {
      options: [{ "declaration-ordering": ["name", "case-insensitive"] }],
      code: `
import a from "e";
import A from "E";
import { b, c, d } from "bcd";
import e from "a";
import E from "A";
      `,
    },
    {
      options: [{ "declaration-ordering": ["name", "lowercase-last"] }],
      code: `
import A from "E";
import E from "A";
import { b, c, d } from "bcd";
import a from "e";
import e from "a";
      `,
    },

    // "declaration-ordering": ["source", ?]

    {
      options: [{ "declaration-ordering": ["source", "case-insensitive"] }],
      code: `
import * as A from "A";
import b from "b";
import "C";
import { d } from "d";
import a from "./a";
import B from "./B";
      `,
    },
    {
      options: [{ "declaration-ordering": ["source", "lowercase-last"] }],
      code: `
import * as A from "A";
import "C";
import b from "b";
import { d } from "d";
import B from "./B";
import a from "./a";
      `,
    },

    // "declaration-ordering": ["type", ?]

    {
      options: [
        { "declaration-ordering": ["type", { secondaryOrdering: ["name", "case-insensitive"] }] },
      ],
      code: `
import "d";
import "D";
import a from "A";
import A from "a";
import * as b from "b";
import * as B from "B";
import { c } from "c";
import { C } from "C";
      `,
    },
    {
      options: [
        { "declaration-ordering": ["type", { secondaryOrdering: ["name", "lowercase-last"] }] },
      ],
      code: `
import "D";
import "d";
import A from "a";
import a from "A";
import * as B from "B";
import * as b from "b";
import { c } from "c";
import { C } from "C";
      `,
    },
    {
      options: [
        { "declaration-ordering": ["type", { secondaryOrdering: ["source", "case-insensitive"] }] },
      ],
      code: `
import "g";
import "H";
import a from "a";
import B from "B";
import * as c from "c";
import * as D from "D";
import { e } from "e";
import { E } from "F";
      `,
    },
    {
      options: [
        { "declaration-ordering": ["type", { secondaryOrdering: ["source", "lowercase-last"] }] },
      ],
      code: `
import "H";
import "g";
import B from "B";
import a from "a";
import * as D from "D";
import * as c from "c";
import { E } from "F";
import { e } from "e";
      `,
    },
    {
      options: [{ "declaration-ordering": ["type", { secondaryOrdering: ["any"] }] }],
      code: `
import "z1";
import "a1";
import z2 from "z2";
import a2 from "a2";
import * as z3 from "z3";
import * as a3 from "a3";
import { z4 } from "z4";
import { a4 } from "a4";
      `,
    },

    // "specifier-ordering": "any"

    {
      options: [{ "specifier-ordering": "any" }],
      code: `import { c, b, a, C, B, A } from "a";`,
    },

    // "specifier-ordering": "lowercase-last"

    {
      options: [{ "specifier-ordering": "lowercase-last" }],
      code: `import { A, B, C, a, b, c } from "a";`,
    },

    // "specifier-ordering": "case-insensitive"

    {
      options: [{ "specifier-ordering": "case-insensitive" }],
      code: `import { A, a, B, b, C, c } from "a";`,
    },

    // "group-ordering"

    {
      options: [{ "group-ordering": groups }],
      code: `
import "b1";
import "b2";

import "../a1";
import "../a2";

import "./b1";
import "./b2";
      `,
    },
  ],
  invalid: [
    // "declaration-ordering": ["name", ?]

    {
      options: [{ "declaration-ordering": ["name", "case-insensitive"] }],
      code: `
import D from "z1";
import c from "z2";
import { foo } from "foo";
import B from "z3";
import a from "z4";
      `,
      output: `
import a from "z4";
import B from "z3";
import { foo } from "foo";
import c from "z2";
import D from "z1";
      `,
      errors: [
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
      ],
    },
    {
      options: [{ "declaration-ordering": ["name", "lowercase-last"] }],
      code: `
import D from "z1";
import c from "z2";
import { foo } from "foo";
import B from "z3";
import a from "z4";
      `,
      output: `
import B from "z3";
import D from "z1";
import { foo } from "foo";
import a from "z4";
import c from "z2";
      `,
      errors: [
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
      ],
    },

    // "declaration-ordering": ["source", ?]

    {
      options: [{ "declaration-ordering": ["source", "case-insensitive"] }],
      code: `
import z1 from "D";
import z2 from "c";
import { foo } from "foo";
import z3 from "B";
import z4 from "a";
      `,
      output: `
import z4 from "a";
import z3 from "B";
import z2 from "c";
import z1 from "D";
import { foo } from "foo";
      `,
      errors: [
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
      ],
    },
    {
      options: [{ "declaration-ordering": ["source", "lowercase-last"] }],
      code: `
import z1 from "D";
import z2 from "c";
import { foo } from "foo";
import z3 from "B";
import z4 from "a";
      `,
      output: `
import z3 from "B";
import z1 from "D";
import z4 from "a";
import z2 from "c";
import { foo } from "foo";
      `,
      errors: [
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
      ],
    },

    // "declaration-ordering": ["type", ?]

    {
      options: [
        { "declaration-ordering": ["type", { secondaryOrdering: ["name", "case-insensitive"] }] },
      ],
      code: `
import { B } from "z1";
import { a } from "z2";
import * as D from "z3";
import * as c from "z4";
import F from "z5";
import e from "z6";
import "z7";
import "z8";
      `,
      output: `
import "z7";
import "z8";
import e from "z6";
import F from "z5";
import * as c from "z4";
import * as D from "z3";
import { B } from "z1";
import { a } from "z2";
      `,
      errors: [
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
      ],
    },
    {
      options: [
        { "declaration-ordering": ["type", { secondaryOrdering: ["name", "lowercase-last"] }] },
      ],
      code: `
import { a } from "z1";
import { B } from "z2";
import * as c from "z3";
import * as D from "z4";
import e from "z5";
import F from "z6";
import "z7";
import "z8";
      `,
      output: `
import "z7";
import "z8";
import F from "z6";
import e from "z5";
import * as D from "z4";
import * as c from "z3";
import { a } from "z1";
import { B } from "z2";
      `,
      errors: [
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
      ],
    },
    {
      options: [
        { "declaration-ordering": ["type", { secondaryOrdering: ["source", "case-insensitive"] }] },
      ],
      code: `
import { z1 } from "B";
import { z2 } from "a";
import * as z3 from "D";
import * as z4 from "c";
import z5 from "F";
import z6 from "e";
import "H";
import "g";
      `,
      output: `
import "g";
import "H";
import z6 from "e";
import z5 from "F";
import * as z4 from "c";
import * as z3 from "D";
import { z2 } from "a";
import { z1 } from "B";
      `,
      errors: [
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
      ],
    },
    {
      options: [
        { "declaration-ordering": ["type", { secondaryOrdering: ["source", "lowercase-last"] }] },
      ],
      code: `
import { z1 } from "a";
import { z2 } from "B";
import * as z3 from "c";
import * as z4 from "D";
import z5 from "e";
import z6 from "F";
import "g";
import "H";
      `,
      output: `
import "H";
import "g";
import z6 from "F";
import z5 from "e";
import * as z4 from "D";
import * as z3 from "c";
import { z2 } from "B";
import { z1 } from "a";
      `,
      errors: [
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
      ],
    },
    {
      options: [{ "declaration-ordering": ["type", { secondaryOrdering: ["any"] }] }],
      code: `
import { z4 } from "z4";
import { a4 } from "a4";
import * as z3 from "z3";
import * as a3 from "a3";
import z2 from "z2";
import a2 from "a2";
import "z1";
import "a1";
      `,
      output: `
import "z1";
import "a1";
import z2 from "z2";
import a2 from "a2";
import * as z3 from "z3";
import * as a3 from "a3";
import { z4 } from "z4";
import { a4 } from "a4";
      `,
      errors: [
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
        { message: "unordered import declaration" },
      ],
    },

    // "specifier-ordering": "lowercase-last"

    {
      options: [{ "specifier-ordering": "lowercase-last" }],
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

    // "specifier-ordering": "case-insensitive"

    {
      options: [{ "specifier-ordering": "case-insensitive" }],
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

    // "group-ordering"

    {
      options: [{ "group-ordering": groups }],
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
    {
      options: [{ "group-ordering": groups }],
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
    {
      options: [{ "declaration-ordering": ["any"], "group-ordering": groups }],
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
