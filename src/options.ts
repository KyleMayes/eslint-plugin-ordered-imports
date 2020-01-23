// SPDX-License-Identifier: Apache-2.0

import { Input } from "./input";
import { Transform, getTransform } from "./order";

/** An import group definition. */
export interface ImportGroupDefinition {
  name: string;
  match: RegExp;
  order: number;
}

/** The normalized rule options. */
export class Options {
  sourceOrder: Transform;
  specifierOrder: Transform;
  groupOrder?: ImportGroupDefinition[];

  constructor(input: Input) {
    this.sourceOrder = getTransform(input["source-order"] ?? "lowercase-last");
    this.specifierOrder = getTransform(input["specifier-order"] ?? "lowercase-last");

    this.groupOrder = input["group-order"]?.map(g => ({
      name: g.name,
      match: new RegExp(g.match),
      order: g.order,
    }));

    this.groupOrder?.push({
      name: "fallback",
      match: /.*/,
      order: Number.MAX_SAFE_INTEGER,
    });
  }
}
