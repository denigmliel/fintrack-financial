"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, PiggyBank, Target, Zap } from "lucide-react";
import { Transaction, formatJutaLabel, formatRupiah } from "@/lib/types";
import { getTotalSavings } from "@/lib/store";

interface StatsCardsProps {
  transactions: Transaction[];
  yearlyGoal: number;
  monthlySavingsPlan: number;
  cryptoThreshold: number;
}

export default function StatsCards({
  transactions,
  yearlyGoal,
  monthlySavingsPlan,
  cryptoThreshold,
}: StatsCardsProps) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const hasTransactions = transactions.length > 0;

  const stats = useMemo(() => {
    const hasYearlyGoal = yearlyGoal > 0;
    const hasMonthlyPlan = monthlySavingsPlan > 0;
    const hasCryptoThreshold = cryptoThreshold > 0;

    const currentMonthTx = transactions.filter((t) =>
      t.date.startsWith(currentMonth)
    );

    const monthIncome = currentMonthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);

    const monthExpense = currentMonthTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    const monthSavings = currentMonthTx
      .filter((t) => t.category === "tabungan" || t.category === "crypto")
      .reduce((s, t) => s + t.amount, 0);

    const totalSavings = getTotalSavings(transactions);
    const progress = hasYearlyGoal
      ? Math.min((totalSavings / yearlyGoal) * 100, 100)
      : 0;
    const remaining = hasYearlyGoal ? Math.max(yearlyGoal - totalSavings, 0) : 0;
    const monthsNeeded =
      hasYearlyGoal && hasMonthlyPlan && remaining > 0
        ? Math.ceil(remaining / monthlySavingsPlan)
        : 0;
    const canInvestCrypto = hasCryptoThreshold && totalSavings >= cryptoThreshold;
    const cryptoProgress = hasCryptoThreshold
      ? Math.min((totalSavings / cryptoThreshold) * 100, 100)
      : 0;

    return {
      monthIncome,
      monthExpense,
      monthSavings,
      totalSavings,
      progress,
      remaining,
      monthsNeeded,
      hasYearlyGoal,
      hasMonthlyPlan,
      hasCryptoThreshold,
      canInvestCrypto,
      cryptoProgress,
      balance: monthIncome - monthExpense,
    };
  }, [transactions, currentMonth, yearlyGoal, monthlySavingsPlan, cryptoThreshold]);

  return (
    <div className="space-y-4">
      {/* Main Goal Progress */}
      <div className="glass-card p-5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background:
              "radial-gradient(ellipse at top right, #22c55e, transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-green-400" />
              <span className="text-sm font-display font-semibold" style={{ color: "var(--text-secondary)" }}>
                {stats.hasYearlyGoal ? `Target ${formatJutaLabel(yearlyGoal)}` : "Target belum diatur"}
              </span>
            </div>
            <span
              className="text-xs font-mono px-2 py-1 rounded-full"
              style={{
                background:
                  stats.hasYearlyGoal && stats.progress >= 100
                    ? "rgba(34,197,94,0.2)"
                    : "var(--border)",
                color:
                  stats.hasYearlyGoal && stats.progress >= 100
                    ? "var(--accent-green)"
                    : "var(--text-muted)",
              }}
            >
              {stats.hasYearlyGoal ? `${stats.progress.toFixed(1)}%` : "-"}
            </span>
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-3xl font-mono font-bold text-glow" style={{ color: "var(--accent-green)" }}>
              {hasTransactions ? formatRupiah(stats.totalSavings) : "-"}
            </span>
            <span className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              {stats.hasYearlyGoal ? `/ ${formatRupiah(yearlyGoal)}` : "/ -"}
            </span>
          </div>
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{ width: `${stats.progress}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {stats.hasYearlyGoal ? `Sisa ${formatRupiah(stats.remaining)}` : "Isi target di Pengaturan"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {!stats.hasYearlyGoal
                ? "-"
                : !stats.hasMonthlyPlan && stats.remaining > 0
                  ? "Set target/bulan"
                  : stats.monthsNeeded > 0
                    ? `~${stats.monthsNeeded} bulan lagi`
                    : "Target tercapai"}
            </span>
          </div>
        </div>
      </div>

      {/* Crypto Investment Alert */}
      <div
        className="glass-card p-4 relative overflow-hidden"
        style={{
          borderColor: stats.canInvestCrypto ? "rgba(139,92,246,0.4)" : undefined,
          boxShadow: stats.canInvestCrypto ? "0 0 30px rgba(139,92,246,0.15)" : undefined,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} style={{ color: stats.canInvestCrypto ? "#8b5cf6" : "var(--text-muted)" }} />
          <span className="text-sm font-semibold" style={{ color: stats.canInvestCrypto ? "#8b5cf6" : "var(--text-secondary)" }}>
            {stats.canInvestCrypto
              ? "Siap Investasi Crypto!"
              : stats.hasCryptoThreshold
                ? "Threshold Crypto"
                : "Threshold Crypto belum diatur"}
          </span>
        </div>
        {stats.canInvestCrypto ? (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Tabunganmu sudah mencapai {formatRupiah(cryptoThreshold)}! Waktunya diversifikasi ke crypto untuk akselerasi target.
          </p>
        ) : !stats.hasCryptoThreshold ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Atur threshold di Pengaturan agar progres crypto bisa dihitung.
          </p>
        ) : (
          <>
            <div className="progress-bar mt-2" style={{ background: "rgba(139,92,246,0.1)" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: "100px",
                  background: "linear-gradient(90deg, #6d28d9, #8b5cf6)",
                  width: `${stats.cryptoProgress}%`,
                  transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {hasTransactions ? formatRupiah(stats.totalSavings) : "-"}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Target {formatRupiah(cryptoThreshold)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Monthly Overview Grid */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Pemasukan</span>
          </div>
          <p className="text-xl font-mono font-bold" style={{ color: "var(--accent-green)" }}>
            {hasTransactions ? formatRupiah(stats.monthIncome) : "-"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>bulan ini</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={14} style={{ color: "var(--accent-red)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Pengeluaran</span>
          </div>
          <p className="text-xl font-mono font-bold" style={{ color: "var(--accent-red)" }}>
            {hasTransactions ? formatRupiah(stats.monthExpense) : "-"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>bulan ini</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <PiggyBank size={14} style={{ color: "var(--accent-gold)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Ditabung</span>
          </div>
          <p className="text-xl font-mono font-bold" style={{ color: "var(--accent-gold)" }}>
            {hasTransactions ? formatRupiah(stats.monthSavings) : "-"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {stats.hasMonthlyPlan ? `target ${formatRupiah(monthlySavingsPlan)}` : "target belum diatur"}
          </p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sisa Bersih</span>
          </div>
          <p
            className="text-xl font-mono font-bold"
            style={{
              color: !hasTransactions
                ? "var(--text-muted)"
                : stats.balance >= 0
                  ? "var(--accent-green)"
                  : "var(--accent-red)",
            }}
          >
            {hasTransactions ? `${stats.balance >= 0 ? "+" : ""}${formatRupiah(stats.balance)}` : "-"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>bulan ini</p>
        </div>
      </div>
    </div>
  );
}
