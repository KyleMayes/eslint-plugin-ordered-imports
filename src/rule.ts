// SPDX-License-Identifier: Apache-2.0

import { AST, Rule } from "eslint";
import { ImportDeclaration, ImportSpecifier, Program, SourceLocation } from "estree";

import { ImportGroupDefinition, Options } from "./options";
import { sort } from "./order";

/** The `"ordered-imports"` rule. */
export const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    fixable: "code",
    schema: [require("./input.json")],
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
  if (options.groupOrder) {
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
    group.checkSources(context, options);
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
    this.group = options.groupOrder?.find(g => g.match.test(source));
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
      s => options.specifierOrder(s.imported.name),
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

  /** Checks the ordering of the import sources in this group. */
  checkSources(context: Rule.RuleContext, options: Options) {
    reorder(
      context,
      this.imports.map(i => i.declaration),
      s => options.sourceOrder(s.source.value?.toString() ?? ""),
      s => s.range!,
      "unordered import source",
    );
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
