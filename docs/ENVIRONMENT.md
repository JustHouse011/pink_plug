# Environment configuration

No required application environment variables are read by app/, src/, Expo config, Metro/Babel config or the retained Figma scripts. The root [.env.example](../.env.example) is intentionally comment-only. The mock frontend needs no API key or URL to start. __DEV__ is a bundler flag used for the OTA check, not a supplied environment value.

Expo identity/update settings live in app.json; channels/build profiles live in eas.json. These identifiers are metadata, not secrets. .mise.toml selects Node 22 and pnpm for Figma tooling.

The reviewed API proposal names EXPO_PUBLIC_API_BASE_URL for future integration; no code reads it today. Choose real per-environment URLs and implement the client before adding it to the template. No EXPO_PUBLIC_API_KEY contract exists. Never bundle privileged keys, passwords, session tokens, signing credentials or database access in EXPO_PUBLIC_* values.

When approved, document variable names, purpose, requiredness and owner here. Put sanitized placeholders in .env.example, local values in ignored files and backend secrets in the approved server secret store. EAS profile names alone do not isolate API environments. Verify channel/runtime targeting when publishing public configuration changes.

.env* remains ignored with the sole root exception !/.env.example. No .easignore exists: EAS still uses .gitignore. The empty template requires no copy step to run the current frontend.
