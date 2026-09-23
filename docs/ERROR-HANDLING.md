# API errors and loading states

There is no general API client today. Local alerts and timed success are not production responses. Follow the established proposed success/data/meta envelope and success=false/error with code/message/fields in [API specification](API-SPECIFICATION.md). HTTP 204 has no body; do not introduce a competing envelope.

| Condition | Expected integration handling |
| --- | --- |
| 400 | Safe malformed-request message; redact diagnostics. |
| 401 | Approved refresh once where appropriate; otherwise clear owner cache and sign in; avoid loops. |
| 403 | Explain unavailable action; no automatic retry or private resource disclosure. |
| 404 | Show unavailable/not-found rather than the current first-fixture fallback. |
| 409 | Reconcile duplicate/state/idempotency conflicts. |
| 422 | Map field errors while preserving editable input. |
| 429 | Honor Retry-After and throttle resend/submit. |
| 500 / 503 | Retryable failure; preserve input and hide server internals. |
| 410 | Expired/revoked share: no coordinate display. |
| 413 / 415 | Explain upload size/type rejection using approved limits. |
| Offline / timeout | Separate pending/unknown outcome from confirmed failure; retain idempotency key for mutation retries. |

Use query keys scoped by owner, filter and page; cancel stale reads and clear private cache on account change. Separate loading/empty/error states and disable duplicate submissions. Reconcile optimistic changes. Closing a share sheet does not prove delivery. Do not silently queue sensitive contact/location uploads without approved consent semantics.
