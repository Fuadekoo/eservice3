/**
 * Check that every column the seed writes still exists in the schema.
 *
 * `npm run build` compiles only `src/`, so nothing typechecks `prisma/`. Even
 * when it is typechecked, Prisma's argument types are unions and TypeScript
 * waves excess properties through — a seed that wrote the long-dropped
 * `role.officeId` compiled cleanly and only failed against a real database,
 * with a P2022 that names the column but not the line that wrote it.
 *
 * This reads the field names out of schema.prisma, reads the keys each
 * `prisma.<model>.upsert({...})` in the seed writes, and reports any key the
 * model no longer has. Run it with `npm run check:seed`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const schemaText = readFileSync(join(here, "schema.prisma"), "utf8");
const seedText = readFileSync(join(here, "seed.ts"), "utf8");

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
    if (!line || line.startsWith("//") || line.startsWith("///") || line.startsWith("@@")) {
      continue;
    }

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

/** Keys written at the top level of a `create:`/`update:` object. */
function topLevelKeys(block: string): string[] {
  const keys: string[] = [];
  let depth = 0;

  for (let i = 0; i < block.length; i += 1) {
    const char = block[i];
    if (char === "{" || char === "[" || char === "(") depth += 1;
    else if (char === "}" || char === "]" || char === ")") depth -= 1;
    else if (depth === 1) {
      const rest = block.slice(i);
      const key = /^(\w+)\s*:/.exec(rest);
      if (key && (i === 0 || /[{,\s]/.test(block[i - 1]!))) {
        keys.push(key[1]!);
        i += key[0].length - 1;
      }
    }
  }

  return keys;
}

const models = readSchemaFields();
const problems: string[] = [];
let checked = 0;

const callPattern = /prisma\.(\w+)\.(upsert|create|update)\(\s*\{/g;
for (let match = callPattern.exec(seedText); match; match = callPattern.exec(seedText)) {
  const modelName = match[1]!;
  const fields = models.get(modelName.toLowerCase());
  if (!fields) {
    problems.push(`prisma.${modelName} — no such model in schema.prisma`);
    continue;
  }

  const args = readBlock(seedText, seedText.indexOf("{", match.index));
  const line = seedText.slice(0, match.index).split("\n").length;

  for (const section of ["create", "update"] as const) {
    const marker = new RegExp(`\\b${section}\\s*:\\s*\\{`).exec(args);
    if (!marker) continue;

    const block = readBlock(args, args.indexOf("{", marker.index + marker[0].length - 1));
    checked += 1;

    for (const key of topLevelKeys(block)) {
      if (!fields.has(key)) {
        problems.push(
          `seed.ts:${line}  prisma.${modelName}.${match[2]} ${section} writes "${key}", ` +
            `which model ${modelName} does not have`,
        );
      }
    }
  }
}

console.log(`Checked ${checked} create/update blocks against schema.prisma.`);

if (problems.length === 0) {
  console.log("Every column the seed writes exists. ✅");
} else {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}
