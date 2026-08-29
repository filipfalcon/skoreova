/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * The deployment this bundle belongs to, compiled in by `@foldkit/vite-plugin` from its `buildId`
   * option or the `FOLDKIT_BUILD_ID` environment variable. The server stamps it on the rendered
   * root and hydration compares it, so a page served from another deployment is refused rather than
   * adopted. Not optional: the plugin compiles a value for every command, and both entries require
   * one — vite.config.ts is what guarantees a build never runs without it.
   */
  readonly FOLDKIT_BUILD_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
