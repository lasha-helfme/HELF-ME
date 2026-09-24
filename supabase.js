const SUPABASE_URL = "https://qyfalzvbkiueqiahsdyz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_VUqs37VtA9n38-CDmfNKlw_RuIF5MTK";

window.helfMeSupabase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
