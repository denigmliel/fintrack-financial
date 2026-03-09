export type TransactionType = "income" | "expense";

export type Category =
  | "gaji"
  | "freelance"
  | "investasi"
  | "bonus"
  | "lainnya_masuk"
  | "makan"
  | "transport"
  | "tagihan"
  | "hiburan"
  | "kesehatan"
  | "belanja"
  | "tabungan"
  | "crypto"
  | "lainnya_keluar";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO date string
  createdAt: string;
}

export interface MonthlyBudget {
  month: string; // "YYYY-MM"
  savingsTarget: number;
}

export interface AppState {
  transactions: Transaction[];
  monthlyBudget: MonthlyBudget[];
  savingsTarget: number; // legacy field for savings target
  yearlyGoal: number; // target tabungan tahunan
  monthlySavingsPlan: number; // target tabungan bulanan
  cryptoThreshold: number; // ambang tabungan sebelum crypto
}

export const CATEGORY_LABELS: Record<Category, string> = {
  gaji: "Gaji",
  freelance: "Freelance",
  investasi: "Investasi",
  bonus: "Bonus",
  lainnya_masuk: "Lainnya",
  makan: "Makan & Minum",
  transport: "Transportasi",
  tagihan: "Tagihan & Utilitas",
  hiburan: "Hiburan",
  kesehatan: "Kesehatan",
  belanja: "Belanja",
  tabungan: "Tabungan",
  crypto: "Crypto",
  lainnya_keluar: "Lainnya",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  gaji: "#22c55e",
  freelance: "#84cc16",
  investasi: "#06b6d4",
  bonus: "#a78bfa",
  lainnya_masuk: "#94a3b8",
  makan: "#f97316",
  transport: "#3b82f6",
  tagihan: "#ef4444",
  hiburan: "#ec4899",
  kesehatan: "#14b8a6",
  belanja: "#f59e0b",
  tabungan: "#10b981",
  crypto: "#8b5cf6",
  lainnya_keluar: "#6b7280",
};

export const INCOME_CATEGORIES: Category[] = [
  "gaji",
  "freelance",
  "investasi",
  "bonus",
  "lainnya_masuk",
];

export const EXPENSE_CATEGORIES: Category[] = [
  "makan",
  "transport",
  "tagihan",
  "hiburan",
  "kesehatan",
  "belanja",
  "tabungan",
  "crypto",
  "lainnya_keluar",
];

export function formatRupiah(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function formatRupiahFull(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function formatJutaLabel(amount: number): string {
  const juta = amount / 1_000_000;
  const formatted = Number.isInteger(juta)
    ? juta.toLocaleString("id-ID")
    : juta.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  return `${formatted} Juta`;
}
