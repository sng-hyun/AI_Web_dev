import { createClient } from "@supabase/supabase-js";

export function createPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("환경 변수 NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
  }

  if (!anonKey) {
    throw new Error("환경 변수 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.");
  }

  return createClient(supabaseUrl, anonKey);
}
