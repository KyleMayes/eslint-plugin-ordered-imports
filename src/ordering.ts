// SPDX-License-Identifier: Apache-2.0

import { ImportDeclaration } from "estree";

//================================================
// Name
//================================================

/**
 * An import name (an identifier that appears in an import declaration).
 *
 * ### Examples
 *
 * * `foo` in `import foo from "bar"`
 * * `foo` in `import * as foo from "bar"`
 * * `foo` and `bar` in `import { foo, bar } from "baz"`
 */
export type Name = string;

/** An ordering of import names. */
export type NameOrdering = "case-insensitive" | "lowercase-last" | "any";

/** Returns a key to sort the supplied import name in the supplied ordering. */
export function getNameKey(name: Name, ordering: NameOrdering): string {
  switch (ordering) {
    case "case-insensitive":
      return name.toUpperCase();
    case "lowercase-last":
      return name;
    case "any":
      return "";
  }
}

//================================================
// Source
//================================================

/**
 * An import source (the path in an import declaration).
 *
 * ### Examples
 *
 * * `bar` in `import foo from "bar"`
 * * `./bar` in `import * as foo from "./bar"`
 * * `../baz` in `import { foo, bar } from "../baz"`
 */
export type Source = string;

/** An ordering of import sources. */
export type SourceOrdering = NameOrdering;

/** Returns a key to sort the supplied import source in the supplied ordering. */
export function getSourceKey(source: Source, ordering: SourceOrdering): string {
  const high = source[0] === "." || source[0] === "/" ? 1 : 0;
  const key = getNameKey(source, ordering);
  return `${high}${key}`;
}

//================================================
// Type
//================================================

/**
 * An import declaration type.
 *
 * ### Examples
 *
 * * `"side-effect"` – `import "foo"`
 * * `"default"` – `import foo from "bar"`
 * * `"namespace"` – `import * as foo from "bar"`
 * * `"destructured"` – `import { foo, bar } from "baz"`
 */
export type Type = "side-effect" | "default" | "namespace" | "destructured";

/** Returns the type of the supplied import declaration. */
export function getType(declaration: ImportDeclaration): Type {
  if (declaration.specifiers.length === 0) {
    return "side-effect";
  }

  switch (declaration.specifiers[0].type) {
    case "ImportDefaultSpecifier":
      return "default";
    case "ImportNamespaceSpecifier":
      return "namespace";
    case "ImportSpecifier":
      return "destructured";
  }
}

/** An ordering of import declaration types. */
export type TypeOrdering = [Type, Type, Type, Type];

/** Returns a key to sort the supplied import declaration in the supplied ordering. */
export function getTypeKey(declaration: ImportDeclaration, ordering: TypeOrdering): string {
  return ordering.indexOf(getType(declaration)).toString();
}
