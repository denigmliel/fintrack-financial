import { NextRequest, NextResponse } from "next/server";
import { AppState } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const TABLE_NAME = "finance_states";
const CLIENT_ID_HEADER = "x-client-id";

export const dynamic = "force-dynamic";

function getClientId(req: NextRequest): string | null {
  const clientId = req.headers.get(CLIENT_ID_HEADER)?.trim() ?? "";
  const isValid = /^[a-zA-Z0-9_-]{8,120}$/.test(clientId);
  return isValid ? clientId : null;
}

function noStoreJson(body: unknown, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidInvestmentTargets(value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((target) => {
    if (!isObject(target)) {
      return false;
    }

    return (
      typeof target.id === "string" &&
      target.id.trim().length > 0 &&
      typeof target.name === "string" &&
      target.name.trim().length > 0 &&
      typeof target.targetAmount === "number" &&
      Number.isFinite(target.targetAmount) &&
      target.targetAmount >= 0
    );
  });
}

function isValidStateShape(value: unknown): value is AppState {
  if (!isObject(value)) {
    return false;
  }

  const {
    transactions,
    monthlyBudget,
    savingsTarget,
    yearlyGoal,
    monthlySavingsPlan,
    cryptoThreshold,
    investmentTargets,
  } = value;

  const hasValidInvestmentTargets =
    investmentTargets === undefined || isValidInvestmentTargets(investmentTargets);

  return (
    Array.isArray(transactions) &&
    Array.isArray(monthlyBudget) &&
    typeof savingsTarget === "number" &&
    typeof yearlyGoal === "number" &&
    typeof monthlySavingsPlan === "number" &&
    typeof cryptoThreshold === "number" &&
    hasValidInvestmentTargets
  );
}

export async function GET(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) {
    return noStoreJson({ error: "client_id tidak valid" }, 400);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return noStoreJson({ error: "Supabase belum dikonfigurasi di server" }, 503);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("payload")
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) {
    return noStoreJson({ error: "Gagal memuat data", detail: error.message }, 500);
  }

  if (!data) {
    return noStoreJson({ state: null }, 404);
  }

  return noStoreJson({ state: data.payload });
}

export async function PUT(req: NextRequest) {
  const clientId = getClientId(req);
  if (!clientId) {
    return noStoreJson({ error: "client_id tidak valid" }, 400);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return noStoreJson({ error: "Supabase belum dikonfigurasi di server" }, 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return noStoreJson({ error: "Body JSON tidak valid" }, 400);
  }

  if (!isObject(body) || !("state" in body) || !isValidStateShape(body.state)) {
    return noStoreJson({ error: "Format state tidak valid" }, 400);
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(
      {
        client_id: clientId,
        payload: body.state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    );

  if (error) {
    return noStoreJson({ error: "Gagal menyimpan data", detail: error.message }, 500);
  }

  return noStoreJson({ ok: true });
}
