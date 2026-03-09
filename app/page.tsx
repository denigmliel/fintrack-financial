"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  List,
  BarChart2,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import StatsCards from "@/components/StatsCards";
import AddTransaction from "@/components/AddTransaction";
import TransactionList from "@/components/TransactionList";
import Charts from "@/components/Charts";
import SettingsView from "@/components/SettingsView";
import { formatJutaLabel } from "@/lib/types";

type Tab = "dashboard" | "transactions" | "charts" | "settings";

const NAV_ITEMS = [
  { id: "dashboard" as Tab, label: "Beranda", icon: LayoutDashboard },
  { id: "transactions" as Tab, label: "Transaksi", icon: List },
  { id: "charts" as Tab, label: "Analitik", icon: BarChart2 },
  { id: "settings" as Tab, label: "Pengaturan", icon: Settings },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { state, isLoaded, addTransaction, deleteTransaction, updateSettings } =
    useFinanceStore();
  const currentDateLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  if (!isLoaded) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto mb-3 animate-spin"
            style={{
              borderColor: "var(--accent-green)",
              borderTopColor: "transparent",
            }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Memuat data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-hidden" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl min-w-0 flex-col lg:px-6">
        {/* Header */}
        <header
          className="px-4 pt-6 pb-4 flex items-start justify-between gap-3 lg:px-0 lg:pt-8"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-primary)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.15)" }}
            >
              <TrendingUp size={16} style={{ color: "var(--accent-green)" }} />
            </div>
            <div className="min-w-0">
              <h1
                className="font-display font-bold text-base leading-none"
                style={{ color: "var(--text-primary)" }}
              >
                FinTrack
              </h1>
              <p className="text-xs leading-tight truncate max-w-[150px] sm:max-w-none" style={{ color: "var(--text-muted)" }}>
                {state.yearlyGoal > 0 ? `Menuju ${formatJutaLabel(state.yearlyGoal)}` : "Target belum diatur"}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
              {currentDateLabel}
            </p>
          </div>
        </header>

        {/* Desktop Nav */}
        <div className="hidden lg:block py-4">
          <div className="grid grid-cols-4 gap-2">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="glass-card px-4 py-3 flex items-center justify-center gap-2 transition-all"
                style={{
                  borderColor: activeTab === id ? "rgba(34,197,94,0.35)" : "var(--border)",
                  background: activeTab === id ? "rgba(34,197,94,0.12)" : "var(--bg-card)",
                  color: activeTab === id ? "var(--accent-green)" : "var(--text-muted)",
                }}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-3 py-5 pb-24 sm:px-4 lg:px-0 lg:pt-2 lg:pb-8">
          {activeTab === "dashboard" && (
            <div className="animate-in grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]">
              <StatsCards
                transactions={state.transactions}
                yearlyGoal={state.yearlyGoal}
                monthlySavingsPlan={state.monthlySavingsPlan}
                investmentTargets={state.investmentTargets}
              />
              <div className="min-w-0 xl:sticky xl:top-28 xl:self-start">
                <AddTransaction onAdd={addTransaction} />
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="animate-in grid min-w-0 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
              <div className="min-w-0 xl:sticky xl:top-28 xl:self-start">
                <AddTransaction onAdd={addTransaction} />
              </div>
              <div className="min-w-0">
                <TransactionList
                  transactions={state.transactions}
                  onDelete={deleteTransaction}
                />
              </div>
            </div>
          )}

          {activeTab === "charts" && (
            <div className="animate-in">
              <Charts
                transactions={state.transactions}
                yearlyGoal={state.yearlyGoal}
                monthlySavingsPlan={state.monthlySavingsPlan}
              />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="animate-in w-full xl:max-w-3xl xl:mx-auto">
              <SettingsView state={state} onUpdate={updateSettings} />
            </div>
          )}
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          className="fixed bottom-0 left-0 w-full lg:hidden"
          style={{
            background: "var(--bg-secondary)",
            borderTop: "1px solid var(--border)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            zIndex: 50,
          }}
        >
          <div className="mx-auto w-full max-w-[640px]">
            <div className="flex">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="relative flex-1 flex flex-col items-center gap-1 py-3 transition-all"
                  style={{
                    color: activeTab === id ? "var(--accent-green)" : "var(--text-muted)",
                  }}
                >
                  <Icon size={20} />
                  <span
                    className="text-xs font-medium"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: activeTab === id ? 600 : 400,
                    }}
                  >
                    {label}
                  </span>
                  {activeTab === id && (
                    <div
                      className="absolute bottom-0 w-8 h-0.5 rounded-full"
                      style={{ background: "var(--accent-green)" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
