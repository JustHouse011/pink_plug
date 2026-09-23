# File and media uploads

## Existing frontend

Settings uses expo-image-picker for gallery images and camera selfies. Native flow requests permission, enables square editing and quality 0.8. Web creates an image/* input with optional capture and a local object URL. The selected URI updates mock profile state; no upload occurs. Selfie verification shows a timer-driven success after 1.6 seconds. Profile setup uses a fixed mock photo. No video/document upload or community attachment picker exists.

Permission denial alerts; cancellation produces no update. No server progress/retry/content checking, explicit MIME whitelist, maximum byte count or dimensions are enforced. Picker quality is not a size limit. Review object-URL cleanup and picker exceptions during integration.

## Proposed workflow

[API specification](API-SPECIFICATION.md) E21 accepts multipart media. E16 attaches an owned completed profile_photo ID. E22/E23 provide metadata/deletion lifecycle; E24/E25 define private selfie submission/status. The Media model defines returned metadata and a visibility-authorized HTTPS profile URL; verification media URL is null.

Choose allowed formats, actual MIME/content validation, byte/pixel limits, transformations, provider, retention and orphan cleanup before production. Enforce owner/purpose/visibility at attachment and image retrieval. Keep private verification media private. No document/video support is implied.

Preserve previews and separate selecting/uploading/attaching/pending/failed/confirmed states. Handle denied permission, cancellation, 401/403/413/415/422, offline/timeouts and retry. Never mark verified based on a timer or treat local blob/file URIs as server media URLs. No upload implementation or UI change was made.
