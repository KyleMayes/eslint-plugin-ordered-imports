// SPDX-License-Identifier: Apache-2.0

import { AST, Rule } from "eslint";
import { ImportDeclaration, ImportSpecifier, Program, SourceLocation } from "estree";

import { ImportGroupDefinition, Options } from "./options";
import { getNameKey, getSourceKey, getType, getTypeKey } from "./ordering";

function getSchema(): object {
  const schema = require("../input.json");
  delete schema["$schema"];
  return schema;
}

/** The `"ordered-imports"` rule. */
export const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    fixable: "code",
    schema: getSchema(),
  },
  create(context) {
    const options = new Options(context.options[0] ?? {});
    let groups: ImportGroup[] = [];
    return {
      Program: node => (groups = getGroups(node as Program, options)),
      "Program:exit": () => checkGroups(context, options, groups),
    };
  },
};

/** Returns the import groups in the supplied program. */
function getGroups(program: Program, options: Options): ImportGroup[] {
  const groups: ImportGroup[] = [];
  let imports: Import[] = [];

  for (const node of program.body.filter(n => n.type === "ImportDeclaration")) {
    const next = new Import(node as ImportDeclaration, options);
    if (imports.length === 0 || imports[imports.length - 1].isAdjacent(next)) {
      imports.push(next);
    } else {
      groups.push(new ImportGroup(imports));
      imports = [next];
    }
  }

  if (imports.length !== 0) {
    groups.push(new ImportGroup(imports));
  }

  return groups;
}

/** Checks the members and ordering in the supplied import groups. */
function checkGroups(context: Rule.RuleContext, options: Options, groups: ImportGroup[]) {
  if (options.groupOrdering) {
    const source = context.getSourceCode();
    reorder(
      context,
      groups,
      g => (g.group?.order ?? Number.MAX_SAFE_INTEGER).toString(),
      g => [
        source.getIndexFromLoc(g.imports[0].declaration.loc!.start),
        source.getIndexFromLoc(g.imports[g.imports.length - 1].declaration.loc!.end),
      ],
      "unordered import group",
    );

    const seen = new Set();
    for (const group of groups) {
      if (seen.has(group.group)) {
        context.report({
          loc: group.loc,
          message: "unmerged import group",
        });
      } else {
        seen.add(group.group);
      }
    }
  }

  for (const group of groups) {
    group.checkMembers(context);
    group.checkDeclarations(context, options);
    for (const import_ of group.imports) {
      import_.checkSpecifiers(context, options);
    }
  }
}

/** An import declaration. */
class Import {
  public group?: ImportGroupDefinition;

  constructor(public declaration: ImportDeclaration, options: Options) {
    const source = declaration.source.value as string;
    this.group = options.groupOrdering?.find(g => g.match.test(source));
  }

  /** Returns whether this import and the supplied import are adjacent. */
  isAdjacent(other: Import): boolean {
    const endLine = this.declaration.loc!.end.line;
    const startLine = other.declaration.loc!.start.line;
    return endLine + 1 >= startLine;
  }

  /** Checks the ordering of the import specifiers in this import. */
  checkSpecifiers(context: Rule.RuleContext, options: Options) {
    reorder(
      context,
      this.declaration.specifiers.filter((s): s is ImportSpecifier => s.type === "ImportSpecifier"),
      s => getNameKey(s.imported.name, options.specifierOrdering, options.symbolsFirst),
      s => s.range!,
      "unordered import specifier",
    );
  }
}

/** A group of adjacent import declarations. */
class ImportGroup {
  constructor(public imports: Import[]) {}

  get group(): ImportGroupDefinition | undefined {
    return this.imports[0].group;
  }

  get loc(): SourceLocation {
    const start = this.imports[0].declaration.loc!.start;
    const end = this.imports[this.imports.length - 1].declaration.loc!.end;
    return { start, end };
  }

  /** Checks that the members of this group belong in this group. */
  checkMembers(context: Rule.RuleContext) {
    if (this.group) {
      for (const import_ of this.imports.slice(1)) {
        if (import_.group !== this.group) {
          context.report({
            loc: import_.declaration.loc!,
            message: "invalid import group member",
          });
        }
      }
    }
  }

  /** Checks the ordering of the import declarations in this group. */
  checkDeclarations(context: Rule.RuleContext, options: Options) {
    if (!options.declarationOrdering) {
      return;
    }

    // Filter out the side-effect and destructed import declarations for the name ordering.
    let declarations = this.imports.map(i => i.declaration);
    if (options.declarationOrdering.kind === "name") {
      declarations = declarations.filter(d => {
        const type = getType(d);
        return type === "default" || type === "namespace";
      });
    }

    reorder(
      context,
      declarations,
      s => getDeclarationKey(s, options.declarationOrdering!, options.symbolsFirst),
      s => s.range!,
      "unordered import declaration",
    );
  }
}

/** Returns a key to sort the supplied import declaration in the supplied ordering. */
function getDeclarationKey(
  declaration: ImportDeclaration,
  ordering: Required<Options>["declarationOrdering"],
  symbolsFirst: boolean,
): string {
  const name = declaration.specifiers.map(d => d.local.name).find(n => n) ?? "";
  const source = declaration.source.value?.toString() ?? "";
  switch (ordering.kind) {
    case "name":
      return getNameKey(name, ordering.ordering, symbolsFirst);
    case "source":
      return getSourceKey(source, ordering.ordering, symbolsFirst);
    case "type":
      const primary = getTypeKey(declaration, ordering.ordering);

      let secondary = "";
      if (ordering.secondaryOrdering) {
        if (ordering.secondaryOrdering.kind === "name") {
          const type = getType(declaration);
          if (type === "default" || type === "namespace") {
            secondary = getNameKey(name, ordering.secondaryOrdering.ordering, symbolsFirst);
          } else {
            secondary = "";
          }
        } else {
          secondary = getSourceKey(source, ordering.secondaryOrdering.ordering, symbolsFirst);
        }
      }

      return `${primary}:${secondary}`;
  }
}

/** Reorders a list of values with AST ranges to be in a particular order. */
function reorder<T>(
  context: Rule.RuleContext,
  values: T[],
  key: (value: T) => string,
  range: (value: T) => AST.Range,
  message: string,
) {
  // Get the original order of the values.
  const original = values.map((v, i) => ({ index: i, value: v }));

  // Get the sorted order of the values.
  const sorted = sort(original, p => key(p.value));

  // Replace any unsorted values with the sorted value for that index.
  for (let i = 0; i < original.length; ++i) {
    if (sorted[i].index !== i) {
      const [start, end] = range(original[i].value);
      const destination = {
        start: context.getSourceCode().getLocFromIndex(start),
        end: context.getSourceCode().getLocFromIndex(end),
      };

      const replacement = context
        .getSourceCode()
        .getText()
        .substring(...range(sorted[i].value));

      context.report({
        loc: destination,
        message,
        fix: f => f.replaceTextRange(range(original[i].value), replacement),
      });
    }
  }
}

/** Returns a sorted copy of the supplied import values using the supplied key mapper. */
export function sort<T>(values: T[], key: (item: T) => string): T[] {
  return values.slice().sort((a, b) => {
    const aKey = key(a);
    const bKey = key(b);
    if (aKey > bKey) {
      return 1;
    } else if (aKey < bKey) {
      return -1;
    } else {
      return 0;
    }
  });
}
