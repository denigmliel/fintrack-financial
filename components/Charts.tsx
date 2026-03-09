"use client";

import { useMemo } from "react";
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
    </div>
  );
}
