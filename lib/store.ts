"use client";

import { useState, useEffect, useCallback } from "react";
import { Transaction, AppState } from "./types";

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

function normalizeLoadedState(parsed: Partial<AppState>): AppState {
  const merged: AppState = { ...defaultState, ...parsed };
  const shouldClearLegacySample = isLegacySampleData(merged.transactions);
  const normalizedTransactions = shouldClearLegacySample ? [] : merged.transactions;
  const hasTransactions = normalizedTransactions.length > 0;
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
    };
  }

  return {
    ...merged,
    transactions: normalizedTransactions,
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
    (settings: Partial<Pick<AppState, "yearlyGoal" | "monthlySavingsPlan" | "cryptoThreshold">>) => {
      setState((prev) => {
        const newState = { ...prev, ...settings };

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
