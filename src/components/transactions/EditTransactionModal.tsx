"use client";

import { useState } from "react";
import { ALL_CATEGORIES, Category, PAYMENT_METHODS, PaymentMethod, TransactionItem } from "@/types/transaction";
import { X, Loader2, Edit3 } from "lucide-react";

interface EditTransactionModalProps {
  transaction: TransactionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const [amount, setAmount] = useState<string>(transaction?.amount.toString() || "");
  const [description, setDescription] = useState<string>(transaction?.description || "");
  const [category, setCategory] = useState<Category>(transaction?.category || "Other");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transaction?.paymentMethod || "UPI"
  );
  const [isEssential, setIsEssential] = useState<boolean>(transaction?.isEssential || false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          description: description.trim(),
          category,
          paymentMethod,
          isEssential,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#131922] w-full max-w-lg rounded-3xl border border-[#243041] shadow-2xl overflow-hidden text-slate-100">
        <div className="px-6 py-4 border-b border-[#243041] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center border border-teal-800/60">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit Expense</h3>
              <p className="text-xs text-slate-400">Recalculates your safe daily spend immediately</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1B2330] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#243041] bg-[#0B0F14] text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B0F14] border border-[#243041] flex items-center gap-3">
            <input
              type="checkbox"
              id="editIsEssential"
              checked={isEssential}
              onChange={(e) => setIsEssential(e.target.checked)}
              className="h-4 w-4 rounded accent-teal-500"
            />
            <label htmlFor="editIsEssential" className="text-xs text-slate-300 font-medium cursor-pointer">
              Committed essential bill
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-[#1B2330] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-xs font-bold text-white shadow-[0_0_15px_rgba(13,148,136,0.3)] disabled:opacity-50 flex items-center gap-1.5 border border-teal-500/30"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
