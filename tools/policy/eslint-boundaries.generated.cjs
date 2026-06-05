// GENERATED FROM tools/policy-definitions.ts — DO NOT EDIT
// Run 'pnpm policy:gen' to regenerate.

module.exports = {
  extends: ['@nx/enforce-module-boundaries'],
  rules: {
    '@nx/enforce-module-boundaries': [
      'error',
      {
        enforceBuildableLibDependency: true,
        allowCircularSelfDependency: false,
        allow: [],
        depConstraints: [
  {
    "sourceTag": "scope:app",
    "bannedImport": true,
    "allowedTransitive": false,
    "message": "apps/* must not import packages/database directly; use packages/supabase client"
  },
  {
    "sourceTag": "scope:package:ui",
    "bannedImport": true,
    "allowedTransitive": false,
    "message": "UI components must be pure; no data layer access"
  },
  {
    "sourceTag": "scope:package:ui",
    "bannedImport": false,
    "allowedTransitive": true,
    "message": "UI may use pure utility helpers"
  },
  {
    "sourceTag": "scope:package:theme",
    "bannedImport": true,
    "allowedTransitive": false,
    "message": "Theme must not depend on UI; theme is consumed by UI"
  },
  {
    "sourceTag": "scope:tool",
    "bannedImport": true,
    "allowedTransitive": false,
    "message": "tools/* are build-time scripts; cannot import apps/* at runtime"
  },
  {
    "sourceTag": "scope:app:portal",
    "bannedImport": false,
    "allowedTransitive": true,
    "message": "Portal is the consumer; allowed to use Supabase clients"
  },
  {
    "sourceTag": "scope:app:cms",
    "bannedImport": false,
    "allowedTransitive": true,
    "message": "CMS uses Supabase for auth and content storage"
  },
  {
    "sourceTag": "scope:app:portal",
    "onlyDependentsOf": [
      "apps/portal"
    ],
    "bannedImport": false,
    "allowedTransitive": true,
    "message": "Portal uses AI agent; no other app should import AI internals"
  }
],
      },
    ],
  },
};
