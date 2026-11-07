import Papa from "papaparse";
import { CsvImportRow, Category, PaymentMethod } from "@/types/transaction";
import { autoCategorize, normalizeCategory } from "@/lib/financial/categorizer";

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  january: "01", february: "02", march: "03", april: "04", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"
};

export function cleanHeader(h: string): string {
  return h
    .replace(/^\ufeff/, "") // Strip UTF-8 BOM from Excel exports
    .replace(/[\r\n]/g, "")
    .trim();
}

export function normalizeHeaderKey(h: string): string {
  return cleanHeader(h)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DATE_KEYWORDS = [
  "txn date", "txndate", "transaction date", "trans date", "value date", "post date",
  "posting date", "booking date", "entry date", "payment date", "date", "time", "timestamp"
];

const DESC_KEYWORDS = [
  "narration", "particulars", "transaction description", "transaction details",
  "txn description", "description", "merchant name", "merchant", "details", "remarks",
  "payee", "beneficiary", "party name", "counterparty", "desc", "title", "note", "name"
];

const AMOUNT_KEYWORDS = [
  "withdrawal amt", "withdrawal amount", "withdrawals", "withdrawal",
  "debit amt", "debit amount", "debits", "debit", "dr amt", "dr amount", "dr",
  "txn amount", "transaction amount", "amount", "paid amount", "paid",
  "spent", "cost", "total", "price", "charge", "inr", "rs"
];

const CATEGORY_KEYWORDS = ["category", "expense category", "tag", "type", "expense type"];
const METHOD_KEYWORDS = ["payment method", "payment_method", "payment mode", "mode", "channel", "method", "instrument"];

export function findMatchingColumn(headers: string[], keywords: string[]): string | undefined {
  const normalized = headers.map(normalizeHeaderKey);

  // 1. Exact match
  for (const kw of keywords) {
    const idx = normalized.indexOf(kw);
    if (idx !== -1) return headers[idx];
  }

  // 2. Word boundary / Substring match (e.g. "Debit (INR)" -> contains "debit")
  for (const kw of keywords) {
    const idx = normalized.findIndex((h) => {
      const words = h.split(" ");
      return words.includes(kw) || h.includes(kw);
    });
    if (idx !== -1) return headers[idx];
  }

  return undefined;
}

export function parseAmount(val: unknown): number | null {
  if (typeof val === "number") return Math.abs(val) > 0 ? Math.abs(val) : null;
  if (!val || typeof val !== "string") return null;

  const raw = val.trim();
  if (!raw || raw === "-" || raw === "--") return null;

  // Remove currency prefix/suffix: Rs, INR, ₹, $, Cr, Dr, spaces, parentheses, commas
  const cleaned = raw
    .replace(/(?:inr|rs\.?|₹|\$)/gi, "")
    .replace(/[()]/g, "")
    .replace(/\s*(?:dr|cr)\s*$/i, "")
    .replace(/,/g, "")
    .trim();

  const num = parseFloat(cleaned);
  if (isNaN(num) || num === 0) return null;
  return Math.abs(num);
}

export function normalizeDate(val: unknown): string | null {
  if (!val || typeof val !== "string") return null;
  const str = val.trim();
  if (!str) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Clean out time component if present e.g. "05-11-2026 14:30:00"
  const dateOnly = str.split(" ")[0].split("T")[0];

  // DD-Mon-YYYY or DD-Mon-YY (e.g. 05-Nov-2026, 5-Nov-26, 05/Nov/2026)
  const alphaMatch = dateOnly.match(/^(\d{1,2})[-/ ]([a-zA-Z]{3,9})[-/ ](\d{2,4})$/);
  if (alphaMatch) {
    const day = alphaMatch[1].padStart(2, "0");
    const monthKey = alphaMatch[2].toLowerCase();
    const month = MONTH_MAP[monthKey] || "01";
    let year = alphaMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY
  const parts = dateOnly.split(/[./-]/);
  if (parts.length === 3) {
    // If first part is 4 digits (YYYY-MM-DD)
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }

    let year = parts[2];
    if (year.length === 2) year = `20${year}`;
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");

    // Check if month > 12 (likely DD/MM/YYYY)
    if (parseInt(parts[0], 10) > 12) {
      return `${year}-${month}-${day}`;
    }

    // Default to Indian/UK DD-MM-YYYY standard
    return `${year}-${month}-${day}`;
  }

  // Fallback to Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

export interface CsvParseResult {
  validRows: CsvImportRow[];
  invalidRowsCount: number;
  totalParsed: number;
  headers: string[];
  detectedColumns: {
    dateCol?: string;
    descCol?: string;
    amountCol?: string;
    categoryCol?: string;
    methodCol?: string;
  };
  errors: string[];
}

/**
 * Detects the real header row in bank CSVs that have preliminary account metadata lines.
 */
function stripPreambleLines(rawCsv: string): string {
  const lines = rawCsv.split(/\r?\n/);
  if (lines.length <= 1) return rawCsv;

  // Search first 15 lines for the line that has common column headers
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const lineLower = lines[i].toLowerCase();
    const hasDate = DATE_KEYWORDS.some((k) => lineLower.includes(k));
    const hasAmount = AMOUNT_KEYWORDS.some((k) => lineLower.includes(k));
    const hasDesc = DESC_KEYWORDS.some((k) => lineLower.includes(k));

    if ((hasDate && hasAmount) || (hasDate && hasDesc) || (hasAmount && hasDesc)) {
      return lines.slice(i).join("\n");
    }
  }

  return rawCsv;
}

export function parseCsvTransactions(
  csvContent: string,
  columnOverrides?: {
    dateCol?: string;
    descCol?: string;
    amountCol?: string;
    categoryCol?: string;
    methodCol?: string;
  }
): CsvParseResult {
  const cleanContent = stripPreambleLines(csvContent.trim());

  const parsed = Papa.parse<Record<string, string>>(cleanContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => cleanHeader(h),
  });

  const headers = (parsed.meta.fields || []).map(cleanHeader).filter(Boolean);

  if (headers.length === 0) {
    return {
      validRows: [],
      invalidRowsCount: 0,
      totalParsed: 0,
      headers: [],
      detectedColumns: {},
      errors: ["Empty or unreadable CSV file. Please upload a valid CSV."],
    };
  }

  // Find columns (using overrides if provided, or intelligent matching)
  const dateCol = columnOverrides?.dateCol || findMatchingColumn(headers, DATE_KEYWORDS);
  const descCol = columnOverrides?.descCol || findMatchingColumn(headers, DESC_KEYWORDS);
  const amountCol = columnOverrides?.amountCol || findMatchingColumn(headers, AMOUNT_KEYWORDS);
  const catCol = columnOverrides?.categoryCol || findMatchingColumn(headers, CATEGORY_KEYWORDS);
  const methodCol = columnOverrides?.methodCol || findMatchingColumn(headers, METHOD_KEYWORDS);

  const detectedColumns = { dateCol, descCol, amountCol, categoryCol: catCol, methodCol };

  if (!amountCol || !descCol) {
    return {
      validRows: [],
      invalidRowsCount: parsed.data.length,
      totalParsed: parsed.data.length,
      headers,
      detectedColumns,
      errors: [
        `Could not auto-detect columns. Found headers: [${headers.join(", ")}]. Please select which column represents 'Amount' and 'Description'.`,
      ],
    };
  }

  const validRows: CsvImportRow[] = [];
  let invalidCount = 0;

  for (const row of parsed.data) {
    const rawAmount = row[amountCol];
    const rawDesc = row[descCol];
    const rawDate = dateCol ? row[dateCol] : new Date().toISOString().split("T")[0];

    const amount = parseAmount(rawAmount);
    const date = normalizeDate(rawDate) || new Date().toISOString().split("T")[0];
    const description = (rawDesc || "").trim();

    // Skip empty rows or credit rows where amount is empty/0
    if (!amount || !description) {
      invalidCount++;
      continue;
    }

    const rawCat = catCol ? row[catCol]?.trim() : undefined;
    const category = normalizeCategory(rawCat, description);

    const rawMethod = methodCol ? (row[methodCol]?.trim() as PaymentMethod) : "UPI";
    const paymentMethod: PaymentMethod = ["UPI", "Card", "NetBanking", "Cash"].includes(rawMethod)
      ? rawMethod
      : "UPI";

    validRows.push({
      date,
      description,
      amount,
      category,
      paymentMethod,
    });
  }

  return {
    validRows,
    invalidRowsCount: invalidCount,
    totalParsed: parsed.data.length,
    headers,
    detectedColumns,
    errors: [],
  };
}
