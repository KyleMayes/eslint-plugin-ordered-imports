// SPDX-License-Identifier: Apache-2.0

/** An import order. */
export type Order = "case-insensitive" | "lowercase-last" | "any";

/** The available import orders. */
export const orders: Order[] = ["case-insensitive", "lowercase-last", "any"];

/** An import order transformer. */
export type Transform = (value: string) => string;

/** Returns the transformer for the supplied import order. */
export function getTransform(order: Order): Transform {
  switch (order) {
    case "case-insensitive":
      return s => s.toUpperCase();
    case "lowercase-last":
      return s => s;
    case "any":
      return () => "";
  }
}

/** Compares the supplied import sources or import specifiers. */
export function compare(a: string, b: string): 1 | -1 | 0 {
  const aIsHigh = a[0] === "." || a[0] === "/";
  const bIsHigh = b[0] === "." || b[0] === "/";
  if (aIsHigh && !bIsHigh) {
    return 1;
  } else if (!aIsHigh && bIsHigh) {
    return -1;
  } else if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  } else {
    return 0;
  }
}

/** Returns a sorted copy of the supplied import values using the supplied key mapper. */
export function sort<T>(values: T[], key: (item: T) => string): T[] {
  return values.slice().sort((a, b) => compare(key(a), key(b)));
}
