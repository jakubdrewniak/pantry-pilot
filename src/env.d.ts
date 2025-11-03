declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL: string
    readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    readonly OPENROUTER_API_KEY: string
    readonly OPENROUTER_DEFAULT_MODEL: string
  }
}
