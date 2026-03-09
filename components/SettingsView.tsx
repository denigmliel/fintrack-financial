"use client";

import { useMemo, useState } from "react";
import { Settings, Save, Plus, Trash2 } from "lucide-react";
import { AppState, InvestmentTarget, formatRupiahFull } from "@/lib/types";

interface SettingsViewProps {
  state: AppState;
  onUpdate: (
    s: Partial<
      Pick<AppState, "yearlyGoal" | "monthlySavingsPlan" | "cryptoThreshold" | "investmentTargets">
    >
  ) => void;
}

interface EditableInvestmentTarget {
  id: string;
  name: string;
  targetJuta: string;
}

function toMillionInput(amount: number): string {
  return amount > 0 ? String(amount / 1_000_000) : "";
}

function parseMillionInput(value: string): number {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1_000_000 : 0;
}

function createLocalTargetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `target_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toEditableTargets(state: AppState): EditableInvestmentTarget[] {
  if (state.investmentTargets.length > 0) {
    return state.investmentTargets.map((target) => ({
      id: target.id,
      name: target.name,
      targetJuta: toMillionInput(target.targetAmount),
    }));
  }

  if (state.cryptoThreshold > 0) {
    return [
      {
        id: "crypto",
        name: "Crypto",
        targetJuta: toMillionInput(state.cryptoThreshold),
      },
    ];
  }

  return [
    {
      id: createLocalTargetId(),
      name: "Crypto",
      targetJuta: "",
    },
  ];
}

function toPersistedTargets(targets: EditableInvestmentTarget[]): InvestmentTarget[] {
  return targets
    .map((target, index) => {
      const name = target.name.trim();
      const targetAmount = parseMillionInput(target.targetJuta);
      if (!name || targetAmount <= 0) {
        return null;
      }

      return {
        id: target.id.trim() || `investment-${index + 1}`,
        name,
        targetAmount,
      };
    })
    .filter((target): target is InvestmentTarget => Boolean(target));
}

export default function SettingsView({ state, onUpdate }: SettingsViewProps) {
  const [yearlyGoal, setYearlyGoal] = useState(toMillionInput(state.yearlyGoal));
  const [monthlySavings, setMonthlySavings] = useState(toMillionInput(state.monthlySavingsPlan));
  const [investmentTargets, setInvestmentTargets] = useState<EditableInvestmentTarget[]>(toEditableTargets(state));
  const [saved, setSaved] = useState(false);

  const yearlyGoalValue = parseMillionInput(yearlyGoal);
  const monthlySavingsValue = parseMillionInput(monthlySavings);
  const parsedInvestmentTargets = useMemo(
    () => toPersistedTargets(investmentTargets),
    [investmentTargets]
  );
  const totalInvestmentTarget = parsedInvestmentTargets.reduce((sum, target) => sum + target.targetAmount, 0);

  const handleInvestmentChange = (
    id: string,
    field: "name" | "targetJuta",
    value: string
  ) => {
    setInvestmentTargets((prev) =>
      prev.map((target) =>
        target.id === id
          ? {
              ...target,
              [field]: value,
            }
          : target
      )
    );
  };

  const handleAddInvestment = () => {
    setInvestmentTargets((prev) => [
      ...prev,
      {
        id: createLocalTargetId(),
        name: "",
        targetJuta: "",
      },
    ]);
  };

  const handleRemoveInvestment = (id: string) => {
    setInvestmentTargets((prev) => prev.filter((target) => target.id !== id));
  };

  const handleSave = () => {
    onUpdate({
      yearlyGoal: yearlyGoalValue,
      monthlySavingsPlan: monthlySavingsValue,
      investmentTargets: parsedInvestmentTargets,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const monthsNeeded =
    yearlyGoalValue > 0 && monthlySavingsValue > 0
      ? Math.ceil(yearlyGoalValue / monthlySavingsValue)
      : 0;

  return (
    <div className="space-y-5">
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Settings size={18} style={{ color: "var(--accent-green)" }} />
          <h3 className="font-display font-semibold" style={{ color: "var(--text-primary)" }}>
            Target & Rencana
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: "var(--text-muted)" }}>
              Target Tabungan (dalam juta Rp)
            </label>
            <input
              type="number"
              value={yearlyGoal}
              onChange={(e) => setYearlyGoal(e.target.value)}
              placeholder="Contoh: 100"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {yearlyGoalValue > 0 ? `= ${formatRupiahFull(yearlyGoalValue)}` : "Belum diatur"}
            </p>
          </div>

          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: "var(--text-muted)" }}>
              Target Tabungan Per Bulan (dalam juta Rp)
            </label>
            <input
              type="number"
              value={monthlySavings}
              onChange={(e) => setMonthlySavings(e.target.value)}
              placeholder="Contoh: 4"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {monthlySavingsValue > 0 ? `= ${formatRupiahFull(monthlySavingsValue)} / bulan` : "Belum diatur"}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 gap-3">
              <label className="text-xs block font-medium" style={{ color: "var(--text-muted)" }}>
                Daftar Target Investasi (dalam juta Rp)
              </label>
              <button
                type="button"
                onClick={handleAddInvestment}
                className="btn-secondary"
                style={{ padding: "6px 10px", fontSize: "12px", borderRadius: "8px" }}
              >
                <Plus size={13} />
                Tambah
              </button>
            </div>

            <div className="space-y-2">
              {investmentTargets.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Belum ada target. Tambahkan minimal satu jenis investasi.
                </p>
              ) : (
                investmentTargets.map((target) => (
                  <div key={target.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_140px_auto] gap-2">
                    <input
                      type="text"
                      value={target.name}
                      onChange={(e) => handleInvestmentChange(target.id, "name", e.target.value)}
                      placeholder="Contoh: Crypto, Emas, Saham"
                    />
                    <input
                      type="number"
                      value={target.targetJuta}
                      onChange={(e) => handleInvestmentChange(target.id, "targetJuta", e.target.value)}
                      placeholder="Nominal (juta)"
                    />
                    <button
                      type="button"
                      className="btn-secondary justify-center"
                      style={{ borderRadius: "8px", minHeight: "40px", padding: "0 10px" }}
                      onClick={() => handleRemoveInvestment(target.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              {parsedInvestmentTargets.length > 0
                ? `${parsedInvestmentTargets.length} target valid, total ${formatRupiahFull(totalInvestmentTarget)}`
                : "Isi nama dan nominal > 0 agar target tersimpan"}
            </p>
          </div>
        </div>

        <div
          className="mt-5 p-4 rounded-xl"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Proyeksi
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--text-muted)" }}>Target total</span>
              <span className="font-mono" style={{ color: "var(--text-primary)" }}>
                {yearlyGoalValue > 0 ? formatRupiahFull(yearlyGoalValue) : "-"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--text-muted)" }}>Tabungan / bulan</span>
              <span className="font-mono" style={{ color: "var(--accent-green)" }}>
                {monthlySavingsValue > 0 ? formatRupiahFull(monthlySavingsValue) : "-"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--text-muted)" }}>Estimasi waktu</span>
              <span className="font-mono" style={{ color: "var(--accent-gold)" }}>
                {monthsNeeded > 0 ? `${monthsNeeded} bulan (${(monthsNeeded / 12).toFixed(1)} tahun)` : "-"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--text-muted)" }}>Total target investasi</span>
              <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                {parsedInvestmentTargets.length > 0 ? formatRupiahFull(totalInvestmentTarget) : "-"}
              </span>
            </div>
          </div>

          {parsedInvestmentTargets.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {parsedInvestmentTargets.map((target) => (
                <div key={target.id} className="flex justify-between text-xs">
                  <span className="truncate pr-2" style={{ color: "var(--text-muted)" }}>
                    {target.name}
                  </span>
                  <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                    {formatRupiahFull(target.targetAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn-primary w-full justify-center mt-4"
          onClick={handleSave}
          style={{
            background: saved ? "var(--accent-green-dim)" : undefined,
          }}
        >
          <Save size={15} />
          {saved ? "Tersimpan!" : "Simpan Pengaturan"}
        </button>
      </div>

      <div className="glass-card p-5">
        <h4 className="font-display font-semibold text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
          Tips Meningkatkan Tabungan
        </h4>
        <div className="space-y-3">
          {[
            "Pindahkan dana tabungan segera setelah gajian, jangan tunggu sisa.",
            "Pantau pengeluaran mingguan dan kurangi minimal satu pos tiap bulan.",
            "Saat tabungan cukup, pertimbangkan investasi bertahap sesuai profil risiko.",
            "Fokus pada aset yang jelas dan rencana jangka panjang.",
            "Ketika dapat bonus, sisihkan langsung ke tabungan atau investasi.",
          ].map((tip, i) => (
            <div key={i} className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex-shrink-0">-</span>
              <p>{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
