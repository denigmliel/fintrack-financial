"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Transaction, CATEGORY_LABELS, CATEGORY_COLORS, formatRupiah } from "@/lib/types";
import { getMonthlyData, getCategoryBreakdown } from "@/lib/store";

interface ChartsProps {
  transactions: Transaction[];
  yearlyGoal: number;
  monthlySavingsPlan: number;
}

interface EmptyChartStateProps {
  title: string;
  description: string;
}

interface ExpenseCategorySummary {
  category: Transaction["category"];
  amount: number;
  percentage: number;
}

interface MonthlyExpenseInsight {
  monthKey: string;
  monthLabel: string;
  totalExpense: number;
  topCategory: ExpenseCategorySummary | null;
  topTransaction: Transaction | null;
  categories: ExpenseCategorySummary[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl p-3 text-xs"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: {formatRupiah(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function EmptyChartState({ title, description }: EmptyChartStateProps) {
  return (
    <div
      className="h-full rounded-xl flex items-center justify-center text-center px-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {title}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function monthKeyToLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return monthKey;
  }
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function transactionDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Charts({ transactions, yearlyGoal: _yearlyGoal, monthlySavingsPlan }: ChartsProps) {
  const currentYear = new Date().getFullYear();
  const monthlyPlanLabel = monthlySavingsPlan > 0 ? formatRupiah(monthlySavingsPlan) : "belum diatur";

  const monthlyData = useMemo(
    () => getMonthlyData(transactions, currentYear),
    [transactions, currentYear]
  );

  const hasFlowData = monthlyData.some((m) => m.income > 0 || m.expense > 0);
  const hasSavingsData = monthlyData.some((m) => m.savings > 0);

  const savingsTrajectory = useMemo(() => {
    let cumSavings = 0;
    return monthlyData.map((m, i) => {
      cumSavings += m.savings;
      return {
        ...m,
        cumSavings,
        target: monthlySavingsPlan * (i + 1),
      };
    });
  }, [monthlyData, monthlySavingsPlan]);

  const expenseBreakdown = useMemo(
    () => getCategoryBreakdown(transactions, "expense"),
    [transactions]
  );

  const monthlyExpenseInsights = useMemo<MonthlyExpenseInsight[]>(() => {
    const grouped = new Map<string, Transaction[]>();

    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const monthKey = tx.date.slice(0, 7);
        const existing = grouped.get(monthKey) ?? [];
        existing.push(tx);
        grouped.set(monthKey, existing);
      });

    return Array.from(grouped.entries())
      .sort(([monthA], [monthB]) => monthB.localeCompare(monthA))
      .map(([monthKey, monthTransactions]) => {
        const totalExpense = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const categoryTotals: Partial<Record<Transaction["category"], number>> = {};

        monthTransactions.forEach((tx) => {
          categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + tx.amount;
        });

        const categories: ExpenseCategorySummary[] = Object.entries(categoryTotals)
          .map(([category, amount]) => ({
            category: category as Transaction["category"],
            amount: amount ?? 0,
            percentage: totalExpense > 0 ? ((amount ?? 0) / totalExpense) * 100 : 0,
          }))
          .sort((a, b) => b.amount - a.amount);

        const topTransaction = monthTransactions.reduce<Transaction | null>(
          (maxTx, tx) => {
            if (!maxTx || tx.amount > maxTx.amount) {
              return tx;
            }
            return maxTx;
          },
          null
        );

        return {
          monthKey,
          monthLabel: monthKeyToLabel(monthKey),
          totalExpense,
          topCategory: categories[0] ?? null,
          topTransaction,
          categories,
        };
      });
  }, [transactions]);

  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<string>("");

  useEffect(() => {
    if (monthlyExpenseInsights.length === 0) {
      if (selectedExpenseMonth) {
        setSelectedExpenseMonth("");
      }
      return;
    }

    const hasSelectedMonth = monthlyExpenseInsights.some(
      (insight) => insight.monthKey === selectedExpenseMonth
    );

    if (!hasSelectedMonth) {
      setSelectedExpenseMonth(monthlyExpenseInsights[0].monthKey);
    }
  }, [monthlyExpenseInsights, selectedExpenseMonth]);

  const selectedExpenseInsight = useMemo(() => {
    if (monthlyExpenseInsights.length === 0) {
      return null;
    }
    return (
      monthlyExpenseInsights.find((insight) => insight.monthKey === selectedExpenseMonth) ??
      monthlyExpenseInsights[0]
    );
  }, [monthlyExpenseInsights, selectedExpenseMonth]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3
          className="font-display font-semibold text-sm mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          Pemasukan vs Pengeluaran
        </h3>
        <div style={{ height: 200 }}>
          {hasFlowData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barCategoryGap="30%">
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatRupiah(v)}
                  tick={{ fontSize: 9, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Pemasukan" fill="var(--accent-green)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#ef444460" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              title="Belum ada data pemasukan/pengeluaran"
              description="Grafik akan mengikuti setelah transaksi pertama ditambahkan."
            />
          )}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3
          className="font-display font-semibold text-sm mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Progres Tabungan vs Target
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          {monthlySavingsPlan > 0
            ? `Target bulanan saat ini: ${monthlyPlanLabel}`
            : "Atur target bulanan di Pengaturan untuk menampilkan garis target"}
        </p>
        <div style={{ height: 200 }}>
          {hasSavingsData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsTrajectory}>
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatRupiah(v)}
                  tick={{ fontSize: 9, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumSavings"
                  name="Aktual Tabungan"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#savingsGrad)"
                />
                {monthlySavingsPlan > 0 && (
                  <Area
                    type="monotone"
                    dataKey="target"
                    name="Target Tabungan"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    fill="url(#targetGrad)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              title="Belum ada data tabungan"
              description="Grafik ini akan mengikuti setelah ada transaksi kategori tabungan atau crypto."
            />
          )}
        </div>
      </div>

      {expenseBreakdown.length > 0 ? (
        <div className="glass-card p-5">
          <h3
            className="font-display font-semibold text-sm mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Breakdown Pengeluaran
          </h3>
          <div className="flex gap-4 items-center">
            <div style={{ width: 130, height: 130, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    dataKey="amount"
                    stroke="none"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] || "#6b7280"}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {expenseBreakdown.slice(0, 6).map((entry) => (
                <div key={entry.category} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background:
                        CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] || "#6b7280",
                    }}
                  />
                  <span className="text-xs truncate flex-1" style={{ color: "var(--text-muted)" }}>
                    {CATEGORY_LABELS[entry.category as keyof typeof CATEGORY_LABELS]}
                  </span>
                  <span className="text-xs font-mono flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                    {formatRupiah(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-5">
          <h3
            className="font-display font-semibold text-sm mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Breakdown Pengeluaran
          </h3>
          <div style={{ height: 160 }}>
            <EmptyChartState
              title="Belum ada pengeluaran"
              description="Breakdown akan tampil otomatis setelah ada transaksi pengeluaran."
            />
          </div>
        </div>
      )}

      <div className="glass-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3
            className="font-display font-semibold text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Pengeluaran Terbesar per Bulan
          </h3>

          {monthlyExpenseInsights.length > 0 && (
            <div className="w-full sm:w-auto sm:min-w-[220px]">
              <select
                value={selectedExpenseInsight?.monthKey ?? ""}
                onChange={(e) => setSelectedExpenseMonth(e.target.value)}
              >
                {monthlyExpenseInsights.map((insight) => (
                  <option key={insight.monthKey} value={insight.monthKey}>
                    {insight.monthLabel}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!selectedExpenseInsight ? (
          <div style={{ height: 180 }}>
            <EmptyChartState
              title="Belum ada data pengeluaran bulanan"
              description="Tambahkan transaksi pengeluaran agar kategori dan transaksi terbesar per bulan bisa dianalisis."
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className="rounded-xl p-3"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  Total pengeluaran
                </p>
                <p className="text-base font-mono font-semibold" style={{ color: "var(--accent-red)" }}>
                  {formatRupiah(selectedExpenseInsight.totalExpense)}
                </p>
              </div>

              <div
                className="rounded-xl p-3"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  Kategori terbesar
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {selectedExpenseInsight.topCategory
                    ? CATEGORY_LABELS[selectedExpenseInsight.topCategory.category]
                    : "-"}
                </p>
                <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                  {selectedExpenseInsight.topCategory
                    ? `${formatRupiah(selectedExpenseInsight.topCategory.amount)} (${selectedExpenseInsight.topCategory.percentage.toFixed(1)}%)`
                    : "-"}
                </p>
              </div>

              <div
                className="rounded-xl p-3"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  Transaksi terbesar
                </p>
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {selectedExpenseInsight.topTransaction?.description || "-"}
                </p>
                <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                  {selectedExpenseInsight.topTransaction
                    ? formatRupiah(selectedExpenseInsight.topTransaction.amount)
                    : "-"}
                </p>
              </div>
            </div>

            {selectedExpenseInsight.topTransaction && (
              <div
                className="rounded-xl p-3"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  Detail transaksi terbesar bulan {selectedExpenseInsight.monthLabel}
                </p>
                <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>
                    {selectedExpenseInsight.topTransaction.description}
                  </span>
                  <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                    {CATEGORY_LABELS[selectedExpenseInsight.topTransaction.category]} | {transactionDateLabel(selectedExpenseInsight.topTransaction.date)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                Urutan kategori pengeluaran bulan ini
              </p>
              <div className="space-y-2">
                {selectedExpenseInsight.categories.map((entry) => (
                  <div key={entry.category} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background:
                          CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] || "#6b7280",
                      }}
                    />
                    <span className="text-xs truncate flex-1" style={{ color: "var(--text-muted)" }}>
                      {CATEGORY_LABELS[entry.category]}
                    </span>
                    <span className="text-xs font-mono flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                      {formatRupiah(entry.amount)}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {entry.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
