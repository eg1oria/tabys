import type { ProductSpec } from "@/lib/api/types";

/**
 * Импорт характеристик товара из таблицы: первая колонка — название,
 * остальные непустые — значение (склеиваются через пробел, чтобы
 * «120 | кг» стало «120 кг»). Строка-заголовок вроде «Название /
 * Описание» и строки без значения пропускаются.
 *
 * Разбираем в браузере и без библиотек: .xlsx — это zip с XML внутри,
 * а распаковку умеет DecompressionStream. Старый двоичный .xls
 * не поддерживаем — его достаточно пересохранить в .xlsx.
 *
 * Ограничения длины совпадают с CreateProductDto на бэкенде: лучше
 * сказать про лишнюю длину сразу, чем после нажатия «Сохранить».
 */

export const SPEC_KEY_MAX = 100;
export const SPEC_VALUE_MAX = 300;

export class SpecsImportError extends Error {}

const HEADER_KEYS = /^(название|наименование|характеристика|характеристики|параметр|параметры|свойство|key|name)$/i;
const HEADER_VALUES = /^(описание|значение|значения|величина|value|description)$/i;

export async function importSpecsFile(file: File): Promise<ProductSpec[]> {
  const name = file.name.toLowerCase();
  let table: string[][];
  if (name.endsWith(".xlsx")) {
    table = await readXlsx(await file.arrayBuffer());
  } else if (name.endsWith(".csv") || name.endsWith(".txt") || name.endsWith(".tsv")) {
    table = parseDelimited(decodeText(await file.arrayBuffer()));
  } else if (name.endsWith(".xls")) {
    throw new SpecsImportError("Старый формат .xls не читается — пересохраните файл в Excel как .xlsx");
  } else {
    throw new SpecsImportError("Нужен файл .xlsx или .csv");
  }
  return tableToSpecs(table);
}

export function tableToSpecs(table: string[][]): ProductSpec[] {
  const specs: ProductSpec[] = [];
  const seen = new Map<string, number>();

  table.forEach((raw, index) => {
    const cells = raw.map(clean).filter((cell) => cell !== "");
    if (cells.length === 0) return;
    const [key, ...rest] = cells;
    const value = rest.join(" ");
    if (specs.length === 0 && (HEADER_KEYS.test(key) || HEADER_VALUES.test(value))) return;
    if (value === "") return;

    const line = index + 1;
    if (key.length > SPEC_KEY_MAX) {
      throw new SpecsImportError(`Строка ${line}: название длиннее ${SPEC_KEY_MAX} символов`);
    }
    if (value.length > SPEC_VALUE_MAX) {
      throw new SpecsImportError(`Строка ${line}: значение длиннее ${SPEC_VALUE_MAX} символов`);
    }
    const first = seen.get(key);
    if (first !== undefined) {
      throw new SpecsImportError(`«${key}» встречается дважды: строки ${first} и ${line}`);
    }
    seen.set(key, line);
    specs.push({ key, value });
  });

  if (specs.length === 0) {
    throw new SpecsImportError("В файле не нашлось характеристик: нужны две колонки — название и значение");
  }
  return specs;
}

function clean(cell: string): string {
  return cell.replace(/\s+/g, " ").trim();
}

// ─── .xlsx ───────────────────────────────────────────────────────────────

async function readXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const zip = readZipDirectory(buffer);
  const read = async (path: string) => {
    const entry = zip.get(path);
    return entry ? parseXml(await inflate(buffer, entry)) : null;
  };

  const sheetPath = (await firstSheetPath(read)) ?? "xl/worksheets/sheet1.xml";
  const sheet = await read(sheetPath);
  if (!sheet) throw new SpecsImportError("Не удалось найти лист в файле .xlsx");

  const sharedDoc = await read("xl/sharedStrings.xml");
  const shared = sharedDoc ? byTag(sharedDoc, "si").map(richText) : [];

  const table: string[][] = [];
  for (const row of byTag(sheet, "row")) {
    const cells: string[] = [];
    let next = 0;
    for (const cell of byTag(row, "c")) {
      const ref = cell.getAttribute("r");
      const column = ref ? columnIndex(ref) : next;
      cells[column] = cellText(cell, shared);
      next = column + 1;
    }
    table.push(Array.from(cells, (cell) => cell ?? ""));
  }
  return table;
}

type ReadXml = (path: string) => Promise<Document | null>;

/** Первый лист по порядку вкладок, а не по имени файла: sheet1.xml не обязательно первый. */
async function firstSheetPath(read: ReadXml): Promise<string | null> {
  const workbook = await read("xl/workbook.xml");
  const rels = await read("xl/_rels/workbook.xml.rels");
  const sheet = workbook ? byTag(workbook, "sheet")[0] : undefined;
  if (!sheet || !rels) return null;

  const relId = Array.from(sheet.attributes).find((attr) => attr.localName === "id")?.value;
  const target = byTag(rels, "Relationship")
    .find((rel) => rel.getAttribute("Id") === relId)
    ?.getAttribute("Target");
  if (!target) return null;
  return target.startsWith("/") ? target.slice(1) : `xl/${target}`;
}

function cellText(cell: Element, shared: string[]): string {
  const type = cell.getAttribute("t");
  if (type === "inlineStr") {
    const inline = byTag(cell, "is")[0];
    return inline ? richText(inline) : "";
  }
  const raw = byTag(cell, "v")[0]?.textContent ?? "";
  if (type === "s") return shared[Number(raw)] ?? "";
  if (type === "b") return raw === "1" ? "Да" : "Нет";
  if (type === "str" || type === "e") return raw;
  // Число: 0.25 → «0,25», как пишут в характеристиках.
  const number = Number(raw);
  if (raw === "" || !Number.isFinite(number)) return raw;
  return number.toLocaleString("ru-RU", { maximumFractionDigits: 10, useGrouping: false });
}

/** Текст ячейки с форматированием по кускам; фонетику (rPh) пропускаем. */
function richText(node: Element): string {
  return byTag(node, "t")
    .filter((t) => t.parentElement?.localName !== "rPh")
    .map((t) => t.textContent ?? "")
    .join("");
}

function columnIndex(ref: string): number {
  let index = 0;
  for (const char of ref.toUpperCase()) {
    const code = char.charCodeAt(0);
    if (code < 65 || code > 90) break;
    index = index * 26 + (code - 64);
  }
  return Math.max(index - 1, 0);
}

function byTag(node: Document | Element, localName: string): Element[] {
  return Array.from(node.getElementsByTagNameNS("*", localName));
}

function parseXml(text: string): Document {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new SpecsImportError("Файл .xlsx повреждён");
  }
  return doc;
}

// ─── zip ─────────────────────────────────────────────────────────────────

type ZipEntry = { method: number; compressedSize: number; localOffset: number };

function readZipDirectory(buffer: ArrayBuffer): Map<string, ZipEntry> {
  const view = new DataView(buffer);
  const notZip = () => new SpecsImportError("Это не файл .xlsx — откройте его в Excel и сохраните как .xlsx");

  // Конец центрального каталога ищем с хвоста: после него может быть комментарий.
  let end = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw notZip();

  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const names = new TextDecoder();
  const entries = new Map<string, ZipEntry>();

  for (let i = 0; i < count; i++) {
    if (offset + 46 > buffer.byteLength || view.getUint32(offset, true) !== 0x02014b50) throw notZip();
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const name = names.decode(new Uint8Array(buffer, offset + 46, nameLength));
    entries.set(name, {
      method: view.getUint16(offset + 10, true),
      compressedSize: view.getUint32(offset + 20, true),
      localOffset: view.getUint32(offset + 42, true),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflate(buffer: ArrayBuffer, entry: ZipEntry): Promise<string> {
  const view = new DataView(buffer);
  const header = entry.localOffset;
  const start = header + 30 + view.getUint16(header + 26, true) + view.getUint16(header + 28, true);
  const data = new Uint8Array(buffer, start, entry.compressedSize);

  if (entry.method === 0) return new TextDecoder().decode(data);
  if (entry.method !== 8) throw new SpecsImportError("Неподдерживаемое сжатие в файле .xlsx");

  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

// ─── .csv ────────────────────────────────────────────────────────────────

/** Excel в русской локали сохраняет CSV в windows-1251 — пробуем UTF-8, потом её. */
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1251").decode(buffer);
  }
}

/** Разделитель угадываем по первой строке: «;» (русский Excel), табуляция или запятая. */
function parseDelimited(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [";", "\t", ","].reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best,
  );

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
