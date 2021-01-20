// SPDX-License-Identifier: Apache-2.0

import { NameOrdering, SourceOrdering, TypeOrdering } from "./ordering";

//================================================
// Input
//================================================

/** The definition for the rule options. */
// prettier-ignore
export interface InputOptions {
  "symbols-first"?: boolean;
  "declaration-ordering"?:
    | ["any"]
    | ["name", "case-insensitive" | "lowercase-last"]
    | ["source", "case-insensitive" | "lowercase-last"]
    | ["type", {
        ordering?: TypeOrdering;
        secondaryOrdering?:
          | ["any"]
          | ["name", "case-insensitive" | "lowercase-last"]
          | ["source", "case-insensitive" | "lowercase-last"];
      }];
  "specifier-ordering"?: NameOrdering;
  "group-ordering"?: { name: string; match: string; order: number }[];
}

/** The definition for the rule options array. */
export type InputOptionsArray = [] | [InputOptions];

//================================================
// Options
//================================================

/** An import declaration ordering rule option value for a name ordering. */
export interface NameOrderingOption {
  kind: "name";
  ordering: NameOrdering;
}

/** An import declaration ordering rule option value for a source ordering. */
export interface SourceOrderingOption {
  kind: "source";
  ordering: SourceOrdering;
}

/** An import declaration ordering rule option value for a type ordering. */
export interface TypeOrderingOption {
  kind: "type";
  ordering: TypeOrdering;
  secondaryOrdering?: NameOrderingOption | SourceOrderingOption;
}

/** An import group definition for an import group ordering rule option. */
export interface ImportGroupDefinition {
  name: string;
  match: RegExp;
  order: number;
}

/** The rule options. */
export class Options {
  symbolsFirst: boolean;
  declarationOrdering?: NameOrderingOption | SourceOrderingOption | TypeOrderingOption;
  specifierOrdering: NameOrdering;
  groupOrdering?: ImportGroupDefinition[];

  constructor(input: InputOptions) {
    this.symbolsFirst = input["symbols-first"] ?? true;

    const declarationOrdering = input["declaration-ordering"];
    if (declarationOrdering) {
      if (declarationOrdering[0] === "name") {
        const ordering = declarationOrdering[1];
        this.declarationOrdering = { kind: "name", ordering };
      } else if (declarationOrdering[0] === "source") {
        const ordering = declarationOrdering[1];
        this.declarationOrdering = { kind: "source", ordering };
      } else if (declarationOrdering[0] === "type") {
        const { ordering, secondaryOrdering } = declarationOrdering[1];

        let secondary: TypeOrderingOption["secondaryOrdering"];
        if (secondaryOrdering) {
          if (secondaryOrdering[0] === "name") {
            secondary = { kind: "name", ordering: secondaryOrdering[1] };
          } else if (secondaryOrdering[0] === "source") {
            secondary = { kind: "source", ordering: secondaryOrdering[1] };
          }
        } else {
          secondary = { kind: "source", ordering: "lowercase-last" };
        }

        this.declarationOrdering = {
          kind: "type",
          ordering: ordering || ["side-effect", "default", "namespace", "destructured"],
          secondaryOrdering: secondary,
        };
      }
    } else {
      this.declarationOrdering = { kind: "source", ordering: "lowercase-last" };
    }

    this.specifierOrdering = input["specifier-ordering"] || "lowercase-last";

    this.groupOrdering = input["group-ordering"]?.map(g => ({
      name: g.name,
      match: new RegExp(g.match),
      order: g.order,
    }));

    this.groupOrdering?.push({
      name: "fallback",
      match: /.*/,
      order: Number.MAX_SAFE_INTEGER,
    });
  }
}
