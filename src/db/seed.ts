// src/db/seed.ts
import { db } from "./schema";
import { builtinSource } from "../sources/builtin";
import { registerSource } from "../sources/registry";
import { tatoebaSource } from "../sources/tatoeba";
import { userImportSource } from "../sources/userImport";

registerSource(builtinSource);
registerSource(tatoebaSource);
registerSource(userImportSource);

let seeded = false;

export async function seedBuiltinSentences(): Promise<void> {
  if (seeded) return;

  const count = await db.sentences
    .where("source.type")
    .equals("builtin")
    .count();

  if (count === 0) {
    const sentences = await builtinSource.fetch({});
    await db.sentences.bulkPut(sentences);
  }

  seeded = true;
}
