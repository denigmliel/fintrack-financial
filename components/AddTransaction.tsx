"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Transaction,
  TransactionType,
  Category,
  CATEGORY_LABELS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "@/lib/types";

interface AddTransactionProps {
  onAdd: (tx: Omit<Transaction, "id" | "createdAt">) => void;
}

export default function AddTransaction({ onAdd }: AddTransactionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("makan");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (t: TransactionType) => {
    setType(t);
    setCategory(t === "income" ? "gaji" : "makan");
  };

  const handleAmountChange = (val: string) => {
    // Allow only numbers
    const clean = val.replace(/\D/g, "");
    setAmount(clean);
  };

  const formatDisplayAmount = (val: string) => {
    if (!val) return "";
    return Number(val).toLocaleString("id-ID");
  };

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      setError("Masukkan jumlah yang valid");
      return;
    }
    if (!description.trim()) {
      setError("Masukkan deskripsi transaksi");
      return;
    }

    onAdd({
      type,
      amount: Number(amount),
      category,
      description: description.trim(),
      date,
    });

    // Reset
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setError("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        className="btn-primary w-full min-w-0 justify-center"
        onClick={() => setIsOpen(true)}
        style={{ padding: "14px", fontSize: "15px", borderRadius: "12px" }}
      >
        <Plus size={20} />
        <span className="truncate">Tambah Transaksi</span>
      </button>
    );
  }

  return (
    <div className="glass-card p-4 sm:p-5 animate-in min-w-0" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-base" style={{ color: "var(--text-primary)" }}>
          Transaksi Baru
        </h3>
        <button
          onClick={() => { setIsOpen(false); setError(""); }}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2 mb-4 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
        {(["income", "expense"] as TransactionType[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: type === t ? (t === "income" ? "var(--accent-green)" : "var(--accent-red)") : "transparent",
              color: type === t ? (t === "income" ? "#0a0f0d" : "#fff") : "var(--text-muted)",
            }}
          >
            {t === "income" ? "Pemasukan" : "Pengeluaran"}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="mb-3">
        <label className="text-xs mb-1.5 block" style={{ color: "var(--text-muted)" }}>
          Jumlah (Rp)
        </label>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none select-none text-sm font-mono"
            style={{ color: "var(--text-secondary)" }}
          >
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={formatDisplayAmount(amount)}
            onChange={(e) => handleAmountChange(e.target.value.replace(/\./g, ""))}
            placeholder="0"
            className="input-with-prefix"
          />
        </div>
      </div>

      {/* Category */}
      <div className="mb-3">
        <label className="text-xs mb-1.5 block" style={{ color: "var(--text-muted)" }}>
          Kategori
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="text-xs mb-1.5 block" style={{ color: "var(--text-muted)" }}>
          Deskripsi
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contoh: Gaji bulan Maret"
        />
      </div>

      {/* Date */}
      <div className="mb-4">
        <label className="text-xs mb-1.5 block" style={{ color: "var(--text-muted)" }}>
          Tanggal
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: "var(--accent-red)", background: "rgba(239,68,68,0.1)" }}>
          {error}
        </p>
      )}

      <button className="btn-primary w-full min-w-0 justify-center" onClick={handleSubmit}>
        <Plus size={16} />
        Simpan Transaksi
      </button>
    </div>
  );
}
