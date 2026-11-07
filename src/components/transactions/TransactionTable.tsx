"use client";

import { useState } from "react";
import { TransactionItem, ALL_CATEGORIES } from "@/types/transaction";
import { formatINR } from "@/lib/utils";
import { Search, Trash2, Edit2, Tag } from "lucide-react";

interface TransactionTableProps {
  transactions: TransactionItem[];
  loading: boolean;
  onEdit: (tx: TransactionItem) => void;
  onDelete: (id: string) => void;
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  Food: "bg-amber-950/80 text-amber-300 border-amber-800/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]",
  Rent: "bg-teal-950/80 text-teal-300 border-teal-800/60 shadow-[0_0_8px_rgba(13,148,136,0.2)]",
  Housing: "bg-teal-950/80 text-teal-300 border-teal-800/60 shadow-[0_0_8px_rgba(13,148,136,0.2)]",
  Bills: "bg-sky-950/80 text-sky-300 border-sky-800/60 shadow-[0_0_8px_rgba(56,189,248,0.2)]",
  Utilities: "bg-sky-950/80 text-sky-300 border-sky-800/60 shadow-[0_0_8px_rgba(56,189,248,0.2)]",
  Transport: "bg-cyan-950/80 text-cyan-300 border-cyan-800/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]",
  Transportation: "bg-cyan-950/80 text-cyan-300 border-cyan-800/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]",
  Groceries: "bg-emerald-950/80 text-emerald-300 border-emerald-800/60 shadow-[0_0_8px_rgba(16,185,129,0.2)]",
  Shopping: "bg-slate-800 text-slate-300 border-slate-700",
  Entertainment: "bg-rose-950/80 text-rose-300 border-rose-800/60 shadow-[0_0_8px_rgba(244,63,94,0.2)]",
  Subscriptions: "bg-pink-950/80 text-pink-300 border-pink-800/60 shadow-[0_0_8px_rgba(236,72,153,0.2)]",
  Healthcare: "bg-teal-950/80 text-teal-300 border-teal-800/60 shadow-[0_0_8px_rgba(20,184,166,0.2)]",
  Health: "bg-teal-950/80 text-teal-300 border-teal-800/60 shadow-[0_0_8px_rgba(20,184,166,0.2)]",
  Education: "bg-blue-950/80 text-blue-300 border-blue-800/60 shadow-[0_0_8px_rgba(59,130,246,0.2)]",
  Travel: "bg-orange-950/80 text-orange-300 border-orange-800/60 shadow-[0_0_8px_rgba(251,146,60,0.2)]",
  Other: "bg-slate-900 text-slate-300 border-slate-700",
};

export function TransactionTable({
  transactions,
  loading,
  onEdit,
  onDelete,
  onSearchChange,
  onCategoryChange,
  selectedCategory,
}: TransactionTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense? Your safe daily spend will recalculate immediately.")) {
      setDeletingId(id);
      await onDelete(id);
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-[#131922] backdrop-blur-xl rounded-3xl border border-[#243041] shadow-sm overflow-hidden">
      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-5 border-b border-[#243041] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by merchant or description..."
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-[#243041] bg-[#0B0F14] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="text-xs font-bold px-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          >
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0B0F14]/70 border-b border-[#243041] text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Payment</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243041]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400 font-medium">
                  Loading ledger transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400 font-medium">
                  No transactions found matching your criteria.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const dateFormatted = new Intl.DateTimeFormat("en-IN", {
                  day: "numeric",
                  month: "short",
                }).format(new Date(tx.date));

                const catStyle = CATEGORY_STYLES[tx.category] || CATEGORY_STYLES.Other;

                return (
                  <tr key={tx.id} className="hover:bg-[#1B2330]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-400 whitespace-nowrap">
                      {dateFormatted}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-100 truncate">
                          {tx.merchant || tx.description}
                        </span>
                        {tx.merchant && (
                          <span className="text-[11px] text-slate-400 truncate">
                            {tx.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catStyle}`}>
                        <Tag className="h-2.5 w-2.5 opacity-60" />
                        {tx.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#0B0F14] text-[10px] font-bold text-slate-400 border border-[#243041]">
                        {tx.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-black font-mono text-sm tabular-nums ${
                          tx.type === "credit"
                            ? "text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            : "text-rose-400"
                        }`}
                      >
                        {tx.type === "credit" ? "+" : "-"} {formatINR(tx.amount)}
                      </span>
                      {tx.isEssential && (
                        <span className="block text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          Committed Bill
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(tx)}
                          title="Edit transaction"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-[#1B2330] transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(tx.id)}
                          disabled={deletingId === tx.id}
                          title="Delete transaction"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
