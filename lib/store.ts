"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction, AppState, InvestmentTarget } from "./types";

const STORAGE_KEY = "finance_tracker_data";
const CLIENT_ID_KEY = "finance_tracker_client_id";
const REMOTE_STATE_ENDPOINT = "/api/state";

const defaultState: AppState = {
  transactions: [],
  monthlyBudget: [],
  savingsTarget: 0,
  yearlyGoal: 0,
  monthlySavingsPlan: 0,
  cryptoThreshold: 0,
  investmentTargets: [],
};

const LEGACY_SAMPLE_BY_ID: Record<
  string,
  Pick<Transaction, "type" | "amount" | "category" | "description">
> = {
  "1": { type: "income", amount: 4_500_000, category: "gaji", description: "Gaji bulan ini" },
  "2": { type: "expense", amount: 800_000, category: "makan", description: "Makan sehari-hari" },
  "3": { type: "expense", amount: 350_000, category: "transport", description: "Bensin & transportasi" },
  "4": { type: "expense", amount: 4_000_000, category: "tabungan", description: "Tabungan bulanan" },
  "5": { type: "income", amount: 4_500_000, category: "gaji", description: "Gaji bulan lalu" },
  "6": { type: "expense", amount: 4_000_000, category: "tabungan", description: "Tabungan bulanan" },
  "7": { type: "expense", amount: 750_000, category: "makan", description: "Makan sehari-hari" },
  "8": { type: "expense", amount: 200_000, category: "tagihan", description: "Tagihan listrik" },
};

function generateClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateClientId(): string {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) {
    return existing;
  }
  const created = generateClientId();
  localStorage.setItem(CLIENT_ID_KEY, created);
  return created;
}

function persistLocalState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadLocalState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultState;
    }
    const parsed = JSON.parse(stored) as Partial<AppState>;
    return normalizeLoadedState(parsed);
  } catch (e) {
    console.error("Failed to load local state", e);
    return defaultState;
  }
}

function isLegacySampleData(transactions: Transaction[]): boolean {
  if (transactions.length === 0) {
    return false;
  }

  return transactions.every((tx) => {
    const sample = LEGACY_SAMPLE_BY_ID[tx.id];
    if (!sample) {
      return false;
    }
    return (
      tx.type === sample.type &&
      tx.amount === sample.amount &&
      tx.category === sample.category &&
      tx.description === sample.description
    );
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTargetName(name: unknown): string {
  if (typeof name !== "string") {
    return "";
  }
  return name.trim().slice(0, 40);
}

function normalizeTargetAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return value > 0 ? Math.round(value) : 0;
}

function normalizeTargetId(value: unknown, fallbackIndex: number): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 60);
  }
  return `investment-${fallbackIndex + 1}`;
}

function normalizeInvestmentTargets(value: unknown): InvestmentTarget[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set<string>();
  const normalized: InvestmentTarget[] = [];

  value.forEach((item, index) => {
    if (!isObject(item)) {
      return;
    }

    const name = normalizeTargetName(item.name);
    const targetAmount = normalizeTargetAmount(item.targetAmount);
    if (!name || targetAmount <= 0) {
      return;
    }

    let id = normalizeTargetId(item.id, index);
    while (seenIds.has(id)) {
      id = `${id}-${index + 1}`;
    }

    seenIds.add(id);
    normalized.push({ id, name, targetAmount });
  });

  return normalized;
}

function deriveCryptoThreshold(investmentTargets: InvestmentTarget[]): number {
  return investmentTargets.reduce((max, target) => {
    const isCryptoTarget = target.name.toLowerCase().includes("crypto");
    return isCryptoTarget ? Math.max(max, target.targetAmount) : max;
  }, 0);
}

function normalizeLoadedState(parsed: Partial<AppState>): AppState {
  const merged: AppState = { ...defaultState, ...parsed };
  const shouldClearLegacySample = isLegacySampleData(merged.transactions);
  const normalizedTransactions = shouldClearLegacySample ? [] : merged.transactions;
  const hasTransactions = normalizedTransactions.length > 0;
  const parsedInvestmentTargets = normalizeInvestmentTargets(parsed.investmentTargets);
  const hasExplicitInvestmentTargets = parsedInvestmentTargets.length > 0;
  const normalizedInvestmentTargets =
    hasExplicitInvestmentTargets
      ? parsedInvestmentTargets
      : merged.cryptoThreshold > 0
        ? [{ id: "crypto", name: "Crypto", targetAmount: merged.cryptoThreshold }]
        : [];
  const derivedCryptoThreshold = deriveCryptoThreshold(normalizedInvestmentTargets);
  const usesLegacyPresetTargets =
    merged.yearlyGoal === 100_000_000 &&
    merged.monthlySavingsPlan === 4_000_000 &&
    merged.cryptoThreshold === 20_000_000;

  if (!hasTransactions && usesLegacyPresetTargets) {
    return {
      ...merged,
      transactions: normalizedTransactions,
      savingsTarget: 0,
      yearlyGoal: 0,
      monthlySavingsPlan: 0,
      cryptoThreshold: 0,
      investmentTargets: [],
    };
  }

  return {
    ...merged,
    transactions: normalizedTransactions,
    investmentTargets: normalizedInvestmentTargets,
    cryptoThreshold: hasExplicitInvestmentTargets ? derivedCryptoThreshold : merged.cryptoThreshold,
  };
}

async function fetchRemoteState(clientId: string): Promise<AppState | null> {
  const response = await fetch(REMOTE_STATE_ENDPOINT, {
    method: "GET",
    headers: {
      "x-client-id": clientId,
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch remote state (${response.status})`);
  }

  const payload = (await response.json()) as { state?: Partial<AppState> };
  if (!payload.state) {
    return null;
  }
  return normalizeLoadedState(payload.state);
}

async function pushRemoteState(clientId: string, state: AppState): Promise<void> {
  const response = await fetch(REMOTE_STATE_ENDPOINT, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
    },
    body: JSON.stringify({ state }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save remote state (${response.status})`);
  }
}

export function useFinanceStore() {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  const syncRemoteState = useCallback(async (newState: AppState) => {
    try {
      const clientId = getOrCreateClientId();
      await pushRemoteState(clientId, newState);
    } catch (e) {
      console.error("Remote sync failed", e);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const localState = loadLocalState();
      let nextState = localState;

      try {
        const clientId = getOrCreateClientId();
        const remoteState = await fetchRemoteState(clientId);

        if (remoteState) {
          nextState = remoteState;
          persistLocalState(nextState);
        } else {
          await pushRemoteState(clientId, localState);
        }
      } catch (e) {
        console.error("Remote bootstrap failed, fallback ke local state", e);
      }

      if (active) {
        setState(nextState);
        setIsLoaded(true);
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id" | "createdAt">) => {
      setState((prev) => {
        const newTx: Transaction = {
          ...tx,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        const newState = {
          ...prev,
          transactions: [newTx, ...prev.transactions],
        };

        persistLocalState(newState);
        void syncRemoteState(newState);
        return newState;
      });
    },
    [syncRemoteState]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setState((prev) => {
        const newState = {
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
        };

        persistLocalState(newState);
        void syncRemoteState(newState);
        return newState;
      });
    },
    [syncRemoteState]
  );

  const updateSettings = useCallback(
    (settings: Partial<Pick<AppState, "yearlyGoal" | "monthlySavingsPlan" | "cryptoThreshold" | "investmentTargets">>) => {
      setState((prev) => {
        const nextInvestmentTargets =
          settings.investmentTargets !== undefined
            ? normalizeInvestmentTargets(settings.investmentTargets)
            : prev.investmentTargets;
        const nextCryptoThreshold =
          settings.cryptoThreshold !== undefined
            ? normalizeTargetAmount(settings.cryptoThreshold)
            : deriveCryptoThreshold(nextInvestmentTargets);
        const newState = {
          ...prev,
          ...settings,
          investmentTargets: nextInvestmentTargets,
          cryptoThreshold: nextCryptoThreshold,
        };

        persistLocalState(newState);
        void syncRemoteState(newState);
        return newState;
      });
    },
    [syncRemoteState]
  );

  return {
    state,
    isLoaded,
    addTransaction,
    deleteTransaction,
    updateSettings,
  };
}

export function getTotalSavings(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.category === "tabungan" || t.category === "crypto")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlyData(transactions: Transaction[], year: number) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(year, i, 1).toLocaleString("id-ID", { month: "short" }),
    income: 0,
    expense: 0,
    savings: 0,
    net: 0,
  }));

  transactions
    .filter((t) => new Date(t.date).getFullYear() === year)
    .forEach((t) => {
      const m = new Date(t.date).getMonth();
      if (t.type === "income") {
        months[m].income += t.amount;
      } else {
        months[m].expense += t.amount;
        if (t.category === "tabungan" || t.category === "crypto") {
          months[m].savings += t.amount;
        }
      }
    });

  months.forEach((m) => {
    m.net = m.income - m.expense;
  });

  return months;
}

export function getCategoryBreakdown(transactions: Transaction[], type: "income" | "expense") {
  const breakdown: Record<string, number> = {};
  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
    });
  return Object.entries(breakdown)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
