# Flowise Chat Image Upload Auto-Inject Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let Flowise automatically pass a chat-uploaded image into Pipeboard's `upload_ad_image` MCP tool when the model omits `file` and `image_url`.

**Architecture:** Keep both MCP servers unchanged. Add a narrow Flowise-side helper that augments `upload_ad_image` tool args from current chat uploads, and add a tool-description hint so the model knows that behavior exists.

**Tech Stack:** TypeScript, Jest, Flowise agentflow runtime, MCP tool wrapper, Pipeboard MCP schemas

---

### Task 1: Add failing tests for upload auto-injection

**Files:**
- Create: `packages/components/test/nodes/agentflow/uploadAdImageToolArgs.test.ts`
- Modify: `packages/components/test/nodes/tools/MCP/core.test.ts`

**Step 1: Write the failing helper tests**

Cover:
- `upload_ad_image` injects `file` from a chat image upload
- explicit `file` is preserved
- explicit `image_url` is preserved
- non-image uploads and non-target tools are ignored

**Step 2: Write the failing MCP description test**

Cover:
- `upload_ad_image` tool descriptions mention that chat-uploaded images can be used automatically

**Step 3: Run tests to verify they fail**

Run:

```bash
cd /home/raintech/.config/superpowers/worktrees/Flowise/feat-auto-inject-chat-image-upload/packages/components
pnpm test -- --runInBand test/nodes/agentflow/uploadAdImageToolArgs.test.ts test/nodes/tools/MCP/core.test.ts
```

Expected:
- New tests fail because helper and description augmentation do not exist yet.

### Task 2: Implement the minimal runtime bridge

**Files:**
- Create: `packages/components/nodes/agentflow/uploadAdImageToolArgs.ts`
- Modify: `packages/components/nodes/agentflow/Agent/Agent.ts`
- Modify: `packages/components/nodes/tools/MCP/core.ts`

**Step 1: Add a focused helper**

Implement a helper that:
- accepts tool name, tool args, current uploads, org ID, chatflow ID, and chat ID
- returns unchanged args for non-`upload_ad_image` tools
- returns unchanged args when `file` or `image_url` already exist
- loads `stored-file` image uploads from Flowise storage and converts the most recent image to a Data URL
- uses existing Data URL image uploads directly when present

**Step 2: Call the helper before MCP tool execution**

Patch `Agent.ts` so the helper runs before `selectedTool.call(...)`, and pass the augmented args into the tool call.

**Step 3: Augment the MCP tool description**

Patch `core.ts` so `upload_ad_image` includes a short instruction that chat-uploaded images can be used automatically when no `file` or `image_url` is supplied.

### Task 3: Verify and commit

**Files:**
- Verify all files above

**Step 1: Run focused tests**

Run:

```bash
cd /home/raintech/.config/superpowers/worktrees/Flowise/feat-auto-inject-chat-image-upload/packages/components
pnpm test -- --runInBand test/nodes/agentflow/uploadAdImageToolArgs.test.ts test/nodes/tools/MCP/core.test.ts
```

Expected:
- All targeted tests pass.

**Step 2: Run a second focused regression check**

Run:

```bash
cd /home/raintech/.config/superpowers/worktrees/Flowise/feat-auto-inject-chat-image-upload/packages/components
pnpm test -- --runInBand test/chatGoogleGenerativeAI.common.test.ts
```

Expected:
- Existing Gemini tool-config test still passes.

**Step 3: Commit**

```bash
cd /home/raintech/.config/superpowers/worktrees/Flowise/feat-auto-inject-chat-image-upload
git add packages/components/nodes/agentflow/uploadAdImageToolArgs.ts packages/components/nodes/agentflow/Agent/Agent.ts packages/components/nodes/tools/MCP/core.ts packages/components/test/nodes/agentflow/uploadAdImageToolArgs.test.ts packages/components/test/nodes/tools/MCP/core.test.ts docs/plans/2026-04-09-flowise-chat-image-upload-autoinject-design.md docs/plans/2026-04-09-flowise-chat-image-upload-autoinject.md
git commit -m "fix: inject uploaded chat images into pipeboard upload tool"
```
