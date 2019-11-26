// SPDX-License-Identifier: Apache-2.0

import { JSONSchema4 } from "json-schema";

import { Transform, Order, getTransform, orders } from "./order";

/** The schema for the rule options. */
export const schema: JSONSchema4 = {
  "source-order": { enum: orders },
  "specifier-order": { enum: orders },
  "group-order": {
    type: "array",
    items: {
      type: "object",
      required: ["name", "match", "order"],
      properties: {
        name: { type: "string" },
        match: { type: "string" },
        order: { type: "integer" },
      },
    },
  },
};

/** The input rule options. */
export interface InputOptions {
  "source-order"?: Order;
  "specifier-order"?: Order;
  "group-order"?: { name: string; match: string; order: number }[];
}

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

  constructor(input: InputOptions) {
    this.specifierOrder = getTransform(input["specifier-order"] ?? "lowercase-last");
    this.sourceOrder = getTransform(input["source-order"] ?? "lowercase-last");

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
