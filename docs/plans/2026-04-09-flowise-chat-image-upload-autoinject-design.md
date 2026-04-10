# Flowise Chat Image Upload Auto-Inject Design

## Goal

Allow a Flowise agent using Pipeboard's `upload_ad_image` MCP tool to use an image uploaded in chat without requiring the user to provide a public image URL.

## Problem

Flowise currently stores uploaded chat images and exposes them to multimodal models, but it does not surface those uploads to MCP tool calls. Pipeboard already supports `upload_ad_image(file=...)` with a Data URL or raw base64 string, so the missing integration is entirely inside Flowise.

## Recommended Approach

Implement a Flowise-side bridge with two parts:

1. Detect calls to `upload_ad_image` before the tool executes.
2. If the call does not already include `file` or `image_url`, inject the most recent uploaded chat image as a Data URL from the current chat uploads.

This keeps the MCP servers unchanged and avoids introducing public file URLs.

## Runtime Changes

- Add a small helper in the agentflow layer to normalize tool arguments for image-upload tools.
- For `upload_ad_image`, use the current request's image uploads when available.
- For `stored-file` uploads, load the file from Flowise storage and convert it to a Data URL.
- Preserve explicit tool args. If the model already supplied `file` or `image_url`, do nothing.
- Append a short note to the tool description for `upload_ad_image` so the model knows chat-uploaded images can be used without manually supplying a URL.

## Scope

In scope:

- Pipeboard `upload_ad_image`
- Image uploads attached to the current chat turn
- Stored-file and direct Data URL chat images

Out of scope:

- Generic file injection for all MCP tools
- Cross-session attachment lookup
- Public URL bridges
- Changes to Pipeboard or Gomarble servers

## Error Handling

- If no image upload exists, leave tool args unchanged.
- If an image exists but cannot be read from storage, surface a clear tool execution error instead of silently falling back.
- If the tool already has `file` or `image_url`, never overwrite it.

## Testing

- Unit test the injection helper:
  - injects `file` for `upload_ad_image` when an image upload exists
  - does not override existing `file`
  - does not override existing `image_url`
  - ignores non-image uploads and other tool names
- Unit test the MCP tool description augmentation for `upload_ad_image`.

## Verification

- Run focused Jest tests in `packages/components`.
- Confirm the injected payload is a Data URL string.
- Keep the change isolated to the local Flowise runtime and ready for a worktree commit.
