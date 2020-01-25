// SPDX-License-Identifier: Apache-2.0

import { Order } from "./order";

/** The input rule options. */
export interface Input {
  "source-order"?: Order;
  "specifier-order"?: Order;
  "group-order"?: { name: string; match: string; order: number }[];
}

/** The input rule options array. */
export type InputArray = [] | [Input];
