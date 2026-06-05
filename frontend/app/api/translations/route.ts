import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "translations.json");

type TranslationKey = {
  key: string;
  translations: Record<string, string>;
};

type Language = {
  code: string;
  name: string;
  nativeName: string;
};

type TranslationsData = {
  availableLanguages: Language[];
  translations: TranslationKey[];
};

function readData(): TranslationsData {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { availableLanguages: [], translations: [] };
  }
}

function writeData(data: TranslationsData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// GET /api/translations          → full { availableLanguages, translations }
// GET /api/translations?lang=en  → flat { data: { key: value } }
export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang");
  const data = readData();

  if (lang) {
    const flat: Record<string, string> = {};
    for (const entry of data.translations) {
      flat[entry.key] = entry.translations[lang] ?? entry.translations["en"] ?? entry.key;
    }
    return NextResponse.json({ data: flat });
  }

  return NextResponse.json(data);
}

// POST /api/translations with { language }            → add language
// POST /api/translations with { key, translations }   → add translation key
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = readData();

    if (body.language) {
      const lang: Language = body.language;
      if (data.availableLanguages.some((l) => l.code === lang.code)) {
        return NextResponse.json({ error: "Language already exists" }, { status: 409 });
      }
      data.availableLanguages.push(lang);
      writeData(data);
      return NextResponse.json({ success: true });
    }

    if (body.key != null && body.translations != null) {
      if (data.translations.some((t) => t.key === body.key)) {
        return NextResponse.json({ error: "Key already exists" }, { status: 409 });
      }
      data.translations.push({ key: body.key, translations: body.translations });
      writeData(data);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

// PUT /api/translations with { availableLanguages, translations } → bulk save
// PUT /api/translations with { key, translations }               → update single key
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data = readData();

    if (body.availableLanguages && body.translations) {
      writeData({ availableLanguages: body.availableLanguages, translations: body.translations });
      return NextResponse.json({ success: true });
    }

    if (body.key != null && body.translations != null) {
      const idx = data.translations.findIndex((t) => t.key === body.key);
      if (idx === -1) {
        return NextResponse.json({ error: "Key not found" }, { status: 404 });
      }
      data.translations[idx].translations = body.translations;
      writeData(data);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

// DELETE /api/translations?code=en  → delete language
// DELETE /api/translations?key=...  → delete translation key
export async function DELETE(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const key = req.nextUrl.searchParams.get("key");
  const data = readData();

  if (code) {
    data.availableLanguages = data.availableLanguages.filter((l) => l.code !== code);
    data.translations = data.translations.map((t) => ({
      ...t,
      translations: Object.fromEntries(
        Object.entries(t.translations).filter(([c]) => c !== code)
      ),
    }));
    writeData(data);
    return NextResponse.json({ success: true });
  }

  if (key) {
    data.translations = data.translations.filter((t) => t.key !== key);
    writeData(data);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Provide ?code= or ?key=" }, { status: 400 });
}
