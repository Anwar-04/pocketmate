"use client";

import { useState, useRef } from "react";
import { parseCsvTransactions, CsvParseResult } from "@/lib/csv/parser";
import { formatINR } from "@/lib/utils";
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";

interface CsvDropzoneProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_CSV_TEXT = `date,description,amount,payment_method,category
2026-11-01,House Rent Payment to Landlord,18000,NetBanking,Rent
2026-11-02,BESCOM Electricity Bill,2500,UPI,Bills
2026-11-03,Blinkit Instant Grocery Delivery,1840,UPI,Groceries
2026-11-04,Uber Ride to Office,320,UPI,Transport
2026-11-05,Chai Point Cutting Chai and Samosa,90,UPI,Food
2026-11-06,Swiggy Lunch Bowl,280,UPI,Food
2026-11-07,Netflix Premium Subscription,1499,Card,Subscriptions
2026-11-07,Spotify Family Plan,899,Card,Subscriptions
2026-11-08,Zepto Quick Essentials,640,UPI,Groceries
2026-11-09,Uber Ride to Client Meeting,410,UPI,Transport
2026-11-10,Swiggy Gourmet Dinner with Friends,1650,UPI,Food
2026-11-11,Tea Stall Snacks,45,UPI,Food
2026-11-12,Zomato Late Night Delivery,520,UPI,Food
2026-11-13,HPCL Petrol Pump Fuel,1500,Card,Transport
2026-11-14,Apollo Pharmacy Cold and Cough Medicine,480,Card,Healthcare
2026-11-15,Amazon India Ergonomic Mouse,1299,Card,Shopping
2026-11-16,Airtel Broadband Fiber Bill,1179,UPI,Bills
2026-11-17,BookMyShow PVR Movie Tickets,760,UPI,Entertainment
2026-11-18,Local Fruit Vendor,180,UPI,Groceries
2026-11-19,Tapri Chai and Biscuits,55,UPI,Food`;

export function CsvDropzone({ isOpen, onClose, onSuccess }: CsvDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual column overrides
  const [selectedDateCol, setSelectedDateCol] = useState<string>("");
  const [selectedDescCol, setSelectedDescCol] = useState<string>("");
  const [selectedAmountCol, setSelectedAmountCol] = useState<string>("");
  const [selectedCatCol, setSelectedCatCol] = useState<string>("");
  const [showColumnMapper, setShowColumnMapper] = useState(false);

  if (!isOpen) return null;

  const processText = (
    text: string,
    name: string,
    overrides?: { dateCol?: string; descCol?: string; amountCol?: string; categoryCol?: string }
  ) => {
    setError(null);
    setRawText(text);
    setFileName(name);

    const result = parseCsvTransactions(text, overrides);
    setParseResult(result);

    // Sync column selector defaults from detection
    if (result.detectedColumns.dateCol && !overrides?.dateCol) {
      setSelectedDateCol(result.detectedColumns.dateCol);
    }
    if (result.detectedColumns.descCol && !overrides?.descCol) {
      setSelectedDescCol(result.detectedColumns.descCol);
    }
    if (result.detectedColumns.amountCol && !overrides?.amountCol) {
      setSelectedAmountCol(result.detectedColumns.amountCol);
    }
    if (result.detectedColumns.categoryCol && !overrides?.categoryCol) {
      setSelectedCatCol(result.detectedColumns.categoryCol);
    }

    if (result.validRows.length === 0) {
      setShowColumnMapper(true);
      if (result.errors.length > 0) {
        setError(result.errors[0]);
      } else {
        setError("No valid debit rows found. Please map the columns below.");
      }
    }
  };

  const handleApplyColumnOverrides = (
    newDate = selectedDateCol,
    newDesc = selectedDescCol,
    newAmount = selectedAmountCol,
    newCat = selectedCatCol
  ) => {
    if (!rawText || !fileName) return;
    processText(rawText, fileName, {
      dateCol: newDate || undefined,
      descCol: newDesc || undefined,
      amountCol: newAmount || undefined,
      categoryCol: newCat === "none" ? undefined : newCat || undefined,
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Only .csv files are supported.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File exceeds 2 MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    processText(SAMPLE_CSV_TEXT, "sample-transactions.csv (Benchmark)");
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.validRows.length === 0) return;

    setImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: parseResult.validRows }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Import failed");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const totalImportAmount = parseResult?.validRows.reduce((sum, r) => sum + r.amount, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#131922] w-full max-w-2xl rounded-3xl border border-[#243041] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#243041] flex items-center justify-between bg-[#0B0F14]/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center border border-teal-800/60 shadow-[0_0_10px_rgba(13,148,136,0.2)]">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import CSV Statement</h3>
              <p className="text-xs text-slate-400">
                Supports HDFC, SBI, ICICI, Axis, Kotak, Excel & generic bank statements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1B2330] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span className="font-semibold block">{error}</span>
                {parseResult && parseResult.headers.length > 0 && !showColumnMapper && (
                  <button
                    onClick={() => setShowColumnMapper(true)}
                    className="text-teal-400 hover:underline mt-1 inline-flex items-center gap-1 font-semibold"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>Select columns manually &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Drag & Drop Zone */}
          {!rawText ? (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-teal-500 bg-teal-950/30"
                    : "border-[#243041] hover:border-slate-600 bg-[#0B0F14]/70"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <UploadCloud className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-white">
                  Click to browse or drag and drop your CSV file here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports bank CSVs with Date, Description (or Narration), and Amount (or Debit/Withdrawal).
                </p>
              </div>

              {/* Fast-Track Demo Button */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Want to test with benchmark data?</span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900/60 transition-colors border border-emerald-800/80"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Load Benchmark CSV (20 Rows)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Parsed File & Mapping State */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">{fileName}</p>
                    <p className="text-[11px] text-slate-400">
                      {parseResult?.validRows.length || 0} valid transactions found • Total:{" "}
                      <strong className="text-rose-400">{formatINR(totalImportAmount)}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {parseResult && parseResult.headers.length > 0 && (
                    <button
                      onClick={() => setShowColumnMapper(!showColumnMapper)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 flex items-center gap-1"
                    >
                      <SlidersHorizontal className="h-3 w-3 text-indigo-400" />
                      <span>{showColumnMapper ? "Hide Mapping" : "Map Columns"}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setRawText(null);
                      setParseResult(null);
                      setError(null);
                      setShowColumnMapper(false);
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-400 px-2 py-1"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Column Mapping Selectors (Auto or Manual) */}
              {showColumnMapper && parseResult && parseResult.headers.length > 0 && (
                <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-200">
                      Select CSV Columns
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Pick headers from your statement
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Date Column
                      </label>
                      <select
                        value={selectedDateCol}
                        onChange={(e) => {
                          setSelectedDateCol(e.target.value);
                          handleApplyColumnOverrides(e.target.value, selectedDescCol, selectedAmountCol, selectedCatCol);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose Date --</option>
                        {parseResult.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Description / Narration
                      </label>
                      <select
                        value={selectedDescCol}
                        onChange={(e) => {
                          setSelectedDescCol(e.target.value);
                          handleApplyColumnOverrides(selectedDateCol, e.target.value, selectedAmountCol, selectedCatCol);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose Description --</option>
                        {parseResult.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Amount / Debit Column
                      </label>
                      <select
                        value={selectedAmountCol}
                        onChange={(e) => {
                          setSelectedAmountCol(e.target.value);
                          handleApplyColumnOverrides(selectedDateCol, selectedDescCol, e.target.value, selectedCatCol);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose Amount --</option>
                        {parseResult.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Category (Optional)
                      </label>
                      <select
                        value={selectedCatCol}
                        onChange={(e) => {
                          setSelectedCatCol(e.target.value);
                          handleApplyColumnOverrides(selectedDateCol, selectedDescCol, selectedAmountCol, e.target.value);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="none">Auto-Categorize from text</option>
                        {parseResult.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 5-Row Preview Table */}
              {parseResult && parseResult.validRows.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-300 mb-2">
                    Preview (First 5 of {parseResult.validRows.length} transactions):
                  </p>
                  <div className="border border-[#243041] rounded-2xl overflow-hidden bg-[#0B0F14]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#131922] border-b border-[#243041] text-[10px] uppercase font-bold text-slate-400">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#243041]">
                        {parseResult.validRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#1B2330]/50">
                            <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                              {row.date}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-white truncate max-w-xs">
                              {row.description}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-950 text-teal-300 border border-teal-800/60">
                                {row.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                              - {formatINR(row.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#243041] flex items-center justify-end gap-3 bg-[#0B0F14]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parseResult || parseResult.validRows.length === 0 || importing}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-xs text-white transition-all shadow-[0_0_15px_rgba(13,148,136,0.3)] disabled:opacity-50 flex items-center gap-1.5 border border-teal-500/30"
          >
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>
              {importing
                ? "Importing..."
                : `Confirm & Import ${parseResult?.validRows.length || 0} Transactions`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
