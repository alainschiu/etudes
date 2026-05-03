/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Dev only: treat access token as expired after this many seconds (silent renewal spike). Omit in production. */
  readonly VITE_DRIVE_TOKEN_TTL_SEC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
