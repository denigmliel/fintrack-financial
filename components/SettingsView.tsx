"use client";

import { useState } from "react";
import { Settings, Save } from "lucide-react";
import { AppState, formatRupiahFull } from "@/lib/types";

interface SettingsViewProps {
  state: AppState;
  onUpdate: (s: Partial<Pick<AppState, "yearlyGoal" | "monthlySavingsPlan" | "cryptoThreshold">>) => void;
}

function toMillionInput(amount: number): string {
  return amount > 0 ? String(amount / 1_000_000) : "";
}

function parseMillionInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1_000_000 : 0;
}

export default function SettingsView({ state, onUpdate }: SettingsViewProps) {
  const [yearlyGoal, setYearlyGoal] = useState(toMillionInput(state.yearlyGoal));
  const [monthlySavings, setMonthlySavings] = useState(toMillionInput(state.monthlySavingsPlan));
  const [cryptoThreshold, setCryptoThreshold] = useState(toMillionInput(state.cryptoThreshold));
  const [saved, setSaved] = useState(false);

  const yearlyGoalValue = parseMillionInput(yearlyGoal);
  const monthlySavingsValue = parseMillionInput(monthlySavings);
  const cryptoThresholdValue = parseMillionInput(cryptoThreshold);

  const handleSave = () => {
    onUpdate({
      yearlyGoal: yearlyGoalValue,
      monthlySavingsPlan: monthlySavingsValue,
      cryptoThreshold: cryptoThresholdValue,
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
            <label className="text-xs mb-1.5 block font-medium" style={{ color: "var(--text-muted)" }}>
              Threshold Investasi Crypto (dalam juta Rp)
            </label>
            <input
              type="number"
              value={cryptoThreshold}
              onChange={(e) => setCryptoThreshold(e.target.value)}
              placeholder="Contoh: 20"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {cryptoThresholdValue > 0
                ? `Ketika tabungan mencapai ${formatRupiahFull(cryptoThresholdValue)}, saatnya invest crypto!`
                : "Belum diatur"}
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
              <span style={{ color: "var(--text-muted)" }}>Crypto mulai di</span>
              <span className="font-mono" style={{ color: "#8b5cf6" }}>
                {cryptoThresholdValue > 0 ? formatRupiahFull(cryptoThresholdValue) : "-"}
              </span>
            </div>
          </div>
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
