/**
 * Check that every column the prisma/ scripts name still exists in the schema.
 *
 * `npm run build` compiles only `src/`, so nothing typechecks `prisma/`. And
 * even when it is typechecked, Prisma's argument types are unions and
 * TypeScript waves excess properties through — a script that selected the
 * long-dropped `role.officeId` compiled cleanly and only failed when someone
 * ran it against a real database.
 *
 * This reads the field names out of schema.prisma, reads the keys each
 * `prisma.<model>.<operation>({...})` names, and reports any the model no
 * longer has. It covers `select`, `create`, `update`, `data` and `orderBy` —
 * the blocks that name columns directly. `where` is skipped: its filter syntax
 * is rich enough that checking it honestly would mean reimplementing Prisma's
 * query grammar, and a half-check that cries wolf gets switched off.
 *
 *   npm run check:prisma-fields
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const schemaText = readFileSync(join(here, "schema.prisma"), "utf8");

/** This file describes the problem; it must not be scanned for it. */
const SELF = "check-prisma-fields.ts";

/**
 * Keys Prisma itself understands inside these blocks, which are not columns.
 */
const RESERVED = new Set([
  "AND",
  "OR",
  "NOT",
  "_count",
  "_avg",
  "_sum",
  "_min",
  "_max",
  "connect",
  "connectOrCreate",
  "create",
  "createMany",
  "delete",
  "deleteMany",
  "disconnect",
  "set",
  "update",
  "updateMany",
  "upsert",
  "increment",
  "decrement",
  "multiply",
  "divide",
]);

/** Field names per model, keyed by the model name lowercased. */
function readSchemaFields(): Map<string, Set<string>> {
  const models = new Map<string, Set<string>>();
  let current: string | null = null;

  for (const rawLine of schemaText.split(/\r?\n/)) {
    const line = rawLine.trim();

    const opening = /^model\s+(\w+)\s*\{$/.exec(line);
    if (opening) {
      current = opening[1]!.toLowerCase();
      models.set(current, new Set());
      continue;
    }

    if (!current) continue;
    if (line === "}") {
      current = null;
      continue;
    }
    if (!line || line.startsWith("//") || line.startsWith("@@")) continue;

    const field = /^(\w+)\s+\S/.exec(line);
    if (field) models.get(current)!.add(field[1]!);
  }

  return models;
}

/** The `{ ... }` starting at `open`, honouring nesting. */
function readBlock(text: string, open: number): string {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return text.slice(open);
}

/** Keys written at the top level of an object literal. */
function topLevelKeys(block: string): string[] {
  const keys: string[] = [];
  let depth = 0;

  for (let i = 0; i < block.length; i += 1) {
    const char = block[i];
    if (char === "{" || char === "[" || char === "(") depth += 1;
    else if (char === "}" || char === "]" || char === ")") depth -= 1;
    else if (depth === 1) {
      const key = /^(\w+)\s*:/.exec(block.slice(i));
      if (key && (i === 0 || /[{,\s]/.test(block[i - 1]!))) {
        keys.push(key[1]!);
        i += key[0].length - 1;
      }
    }
  }

  return keys;
}

const CHECKED_SECTIONS = ["select", "create", "update", "data", "orderBy"] as const;

const models = readSchemaFields();
const problems: string[] = [];
let blocksChecked = 0;
let filesScanned = 0;

const files = readdirSync(here)
  .filter((name) => name.endsWith(".ts") && name !== SELF)
  .sort();

for (const file of files) {
  const source = readFileSync(join(here, file), "utf8");
  filesScanned += 1;

  const calls = /prisma\.(\w+)\.(\w+)\(\s*\{/g;
  for (let match = calls.exec(source); match; match = calls.exec(source)) {
    const modelName = match[1]!;
    const fields = models.get(modelName.toLowerCase());
    // `prisma.$transaction` and friends are not models.
    if (modelName.startsWith("$")) continue;
    if (!fields) {
      problems.push(`${file}  prisma.${modelName} — no such model in schema.prisma`);
      continue;
    }

    const args = readBlock(source, source.indexOf("{", match.index));
    const line = source.slice(0, match.index).split("\n").length;

    for (const section of CHECKED_SECTIONS) {
      const marker = new RegExp(`\\b${section}\\s*:\\s*\\{`).exec(args);
      if (!marker) continue;

      const block = readBlock(args, args.indexOf("{", marker.index + marker[0].length - 1));
      blocksChecked += 1;

      for (const key of topLevelKeys(block)) {
        if (RESERVED.has(key) || fields.has(key)) continue;
        problems.push(
          `${file}:${line}  prisma.${modelName}.${match[2]} ${section} names ` +
            `"${key}", which model ${modelName} does not have`,
        );
      }
    }
  }
}

console.log(
  `Checked ${blocksChecked} select/create/update/data/orderBy blocks ` +
    `across ${filesScanned} script(s) in prisma/.`,
);

if (problems.length === 0) {
  console.log("Every column they name exists in schema.prisma. ✅");
} else {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}
