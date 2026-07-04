import "server-only";

import { createClient } from "@supabase/supabase-js";

function readLegacyJwtRole(key: string) {
  if (!key.startsWith("eyJ")) {
    return null;
  }

  try {
    const [, payload] = key.split(".");

    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { role?: string };

    return decoded.role ?? null;
  } catch {
    return null;
  }
}

function assertServiceRoleKey(key: string) {
  if (key.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY에 publishable 또는 anon 키가 설정되어 있습니다. Supabase service role key를 입력해 주세요.",
    );
  }

  const legacyRole = readLegacyJwtRole(key);

  if (legacyRole && legacyRole !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY의 role이 ${legacyRole}입니다. baseline_holdings 쓰기 작업에는 service_role key가 필요합니다.`,
    );
  }
}

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("환경 변수 NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
  }

  if (!serviceRoleKey) {
    throw new Error("환경 변수 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }

  assertServiceRoleKey(serviceRoleKey);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
