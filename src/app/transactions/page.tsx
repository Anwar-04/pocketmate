"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { EditTransactionModal } from "@/components/transactions/EditTransactionModal";
import { CsvDropzone } from "@/components/transactions/CsvDropzone";
import { SmsImportModal } from "@/components/transactions/SmsImportModal";
import { TransactionItem } from "@/types/transaction";
import { Plus, ReceiptText, FileSpreadsheet, Zap } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("all");

  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isCsvOpen, setIsCsvOpen] = useState<boolean>(false);
  const [isSmsOpen, setIsSmsOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "all") params.set("category", category);
      params.set("limit", "50");

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load transactions");

      setTransactions(json.data.transactions);
      setTotal(json.data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching transactions");
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6 pb-24 md:pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#243041]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-950/80 border border-teal-800/60 text-teal-400 shadow-[0_0_12px_rgba(13,148,136,0.2)]">
                <ReceiptText className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Expense Ledger
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {total} verified transactions in active cycle • Every change recalculates daily spend immediately
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSmsOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 font-bold text-xs text-amber-300 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            >
              <Zap className="h-4 w-4 text-amber-400" />
              <span>⚡ Quick Log / SMS</span>
            </button>

            <button
              onClick={() => setIsCsvOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#131922] hover:bg-[#1B2330] border border-[#243041] font-bold text-xs text-slate-300 transition-all shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-xs text-white transition-all shadow-[0_0_15px_rgba(13,148,136,0.3)] border border-teal-500/30"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Transaction Table */}
        <TransactionTable
          transactions={transactions}
          loading={loading}
          onEdit={(tx) => setEditingTx(tx)}
          onDelete={handleDelete}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          selectedCategory={category}
        />

        {/* Modals */}
        <AddTransactionModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => {
            setIsAddOpen(false);
            fetchTransactions();
          }}
        />

        {editingTx && (
          <EditTransactionModal
            transaction={editingTx}
            isOpen={!!editingTx}
            onClose={() => setEditingTx(null)}
            onSuccess={() => {
              setEditingTx(null);
              fetchTransactions();
            }}
          />
        )}

        <CsvDropzone
          isOpen={isCsvOpen}
          onClose={() => setIsCsvOpen(false)}
          onSuccess={() => {
            setIsCsvOpen(false);
            fetchTransactions();
          }}
        />

        <SmsImportModal
          isOpen={isSmsOpen}
          onClose={() => setIsSmsOpen(false)}
          onSuccess={() => {
            setIsSmsOpen(false);
            fetchTransactions();
          }}
        />
      </main>
    </div>
  );
}
