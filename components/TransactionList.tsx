"use client";

import { useState } from "react";
import { Trash2, Search } from "lucide-react";
import {
  Transaction,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  formatRupiahFull,
  TransactionType,
} from "@/lib/types";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const MONTHS = [
  "Semua",
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();

  const filtered = transactions.filter((t) => {
    const tDate = new Date(t.date);
    const matchMonth =
      filterMonth === 0 ||
      (tDate.getMonth() + 1 === filterMonth && tDate.getFullYear() === currentYear);
    const matchType = filterType === "all" || t.type === filterType;
    const matchSearch =
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      CATEGORY_LABELS[t.category].toLowerCase().includes(search.toLowerCase());
    return matchMonth && matchType && matchSearch;
  });

  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const d = new Date(tx.date);
    const key = d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi..."
            style={{ paddingLeft: "36px !important" }}
          />
        </div>

        <div className="flex gap-2">
          {[
            { value: "all", label: "Semua" },
            { value: "income", label: "Masuk" },
            { value: "expense", label: "Keluar" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value as "all" | TransactionType)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background:
                  filterType === f.value ? "var(--accent-green)" : "var(--border)",
                color:
                  filterType === f.value ? "#0a0f0d" : "var(--text-secondary)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {MONTHS.map((m, i) => (
            <button
              key={i}
              onClick={() => setFilterMonth(i)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: filterMonth === i ? "rgba(34,197,94,0.2)" : "var(--border)",
                color: filterMonth === i ? "var(--accent-green)" : "var(--text-muted)",
                border: filterMonth === i ? "1px solid rgba(34,197,94,0.3)" : "1px solid transparent",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {filtered.length} transaksi ditemukan
      </p>

      {Object.keys(grouped).length === 0 ? (
        <div className="glass-card p-6 sm:p-8 text-center">
          <p className="text-2xl mb-2">$</p>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Belum ada transaksi
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Tambahkan transaksi pertamamu
          </p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort((a, b) => {
            const dateA = grouped[a[0]][0].date;
            const dateB = grouped[b[0]][0].date;
            return dateB.localeCompare(dateA);
          })
          .map(([dateLabel, txs]) => (
            <div key={dateLabel}>
              <p className="text-xs font-semibold mb-2 capitalize" style={{ color: "var(--text-muted)" }}>
                {dateLabel}
              </p>
              <div className="space-y-2">
                {txs.map((tx) => (
                  <div
                    key={tx.id}
                    className="glass-card p-3.5 flex min-w-0 items-center gap-3 animate-in"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ background: `${CATEGORY_COLORS[tx.category]}20` }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: CATEGORY_COLORS[tx.category] }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {tx.description}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {CATEGORY_LABELS[tx.category]}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right max-w-[44vw] sm:max-w-none">
                        <p
                          className="text-sm font-mono font-semibold truncate"
                          style={{
                            color: tx.type === "income" ? "var(--accent-green)" : "var(--text-primary)",
                          }}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {formatRupiahFull(tx.amount)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 rounded-lg transition-all flex-shrink-0"
                        style={{
                          color: deleteConfirm === tx.id ? "var(--accent-red)" : "var(--text-muted)",
                          background: deleteConfirm === tx.id ? "rgba(239,68,68,0.1)" : "transparent",
                        }}
                        title={deleteConfirm === tx.id ? "Klik lagi untuk hapus" : "Hapus"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
