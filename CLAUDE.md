# CLAUDE.md — ondeviceml.space project context

## What this is

`ondeviceml.space` ("AI Edge Gallery for Web") — Abhi's flagship on-device AI showcase. 24+ in-browser demos running entirely client-side via MediaPipe / WebGPU / WebNN / Transformers.js. No cloud, no install, no account.

This is the **public artifact** that anchors his ODML / LiteRT / Chintan track at Google Cloud.

Sister project: `bench.ondeviceml.space` (Web AI Bench — runtime comparison harness, separate repo at `~/Core/Workspace/ClaudeCode/web-ai-bench/`).

## Current session focus

**Adding "Research mode" feature** — a multi-step plan-then-retrieve-then-synthesize agentic flow that uses existing `web-actions` + `chat` + `tool-sandbox` features in concert. Single new tab/lane in the gallery, novel UX, ships in ~2 weekends.

**Why this feature, not another demo:** the gallery already has 24 single-shot demos. What it lacks is a *workflow primitive* — agentic, multi-turn, runs an actual task end-to-end. That's the GemmaDesktop-pattern differentiation, but in-browser.

**Spec:** see `docs/features/research-mode.md`.
**Status:** see `STATUS.md`.

## Hard constraints — DO NOT VIOLATE

1. **Single feature, no new project.** This is an addition to `ondeviceml.space`, not a fork.
2. **Reuse existing primitives.** Build on `web-actions`, `chat`, `tool-sandbox`, `vision-rag`. Don't reinvent retrieval, browsing, or chat surfaces. If something doesn't exist yet that you need, *say so* before writing it.
3. **Stay on-device.** No cloud APIs in the hot path. WebGPU/WebNN/MediaPipe only. The whole site's value prop is "fully offline."
4. **Don't divert from vla-bench.** Abhi has a parallel `vla-bench` project (`~/Core/Workspace/ClaudeCode/vla-bench/`) with a $50 hard budget and multi-month timeline. This Research-mode feature lives on weekends; vla-bench lives on the Vast.ai canonical-run waiting time. Different lanes, both ship.
5. **No social/launch/marketing files in git.** Per `feedback_social_posts_never_in_git.md`. Drafts live outside the repo.

## Architecture pointers

```
src/
├── components/      # Layout, sidebar, toggles, error boundary, perf indicators
├── features/        # 24+ feature lanes — each is its own folder
│   ├── ask-audio/       # speech-to-text Q&A
│   ├── ask-image/       # vision Q&A
│   ├── chat/            # primary on-device chat
│   ├── tool-sandbox/    # tool-use sandbox (build on this)
│   ├── vision-rag/      # vision retrieval-augmented gen (build on this)
│   ├── web-actions/     # in-browser web action surface (build on this)
│   ├── ... (21 more)
│   └── research/        # ← THE NEW FEATURE LIVES HERE
├── lib/             # Shared model loaders, runtime utils
├── hooks/           # React hooks
├── contexts/        # React contexts
└── types/           # Shared TypeScript types
```

**Stack:**
- Vite + React + TypeScript
- MediaPipe `tasks-genai` for Gemma 270M / 1B IT
- WebGPU primary runtime; WebNN where available; WASM fallback
- Per `feedback_odml_mediapipe_constraints.md`: `self.import` breaks streaming/WebGPU/Workers — stick with blob URL pattern
- Per `project_odml_memory_optimization.md`: scheduler + GC hints + RAM override are shipped; streaming/Worker are blocked by Vite

## Common commands

```bash
npm run dev       # local dev server
npm test          # vitest
npm run build     # production build
```

## How to work with Abhi

Carries from `~/Core/Workspace/ClaudeCode/CLAUDE.md`:
- Be concise and direct. Lead with the answer.
- Don't over-explain things he already knows. He knows GCP, partnerships, and deal mechanics. Newer to ML internals; intermediate at React/TS.
- Default to sub-agents for research, multi-file reads, transcript analysis, anything where only the result matters.
- Visual outputs (slides, charts, blog drafts): iterate at least twice against the skill rules before showing.
- Never commit social/launch/marketing files. Drafts live outside git.
- Memory rules apply.

## Strategic context (the LinkedIn pitch behind this work)

Two pegs that frame why Research mode matters now:

1. **Daniel Lyalin (Google Gemma DevRel) shipped GemmaDesktop** on 2026-04-27 (17+ stars in 2 days) — a polished Electron app showcasing Gemma 4 with voice in/out, browser-cobrowsing, plan/build/explore modes, research workflows. The narrative line: *"local-first desktop workbench for open models. Run them like real software, not a hidden chatbox."*

2. **`ondeviceml.space` is structurally GemmaDesktop's web equivalent** — same on-device pattern, but accessible without install (corporate-friendly, mobile-friendly, instant try-it). Currently has 24 single-shot demos but no agentic workflow. Adding Research mode lands the "real software" narrative for the web form factor.

**The LinkedIn post (drafted later, in `docs/` not in git):** *"Inspired by Lyalin's GemmaDesktop, I added agentic research to my web AI gallery. Watch a 270M-parameter model plan, browse, and synthesize — all in your browser tab, fully offline."*

## Source-paper anchors (already in his Learning wiki)

- a16z continual learning — `Learning/wiki/concepts/continual-learning.md` (frames why on-device matters for the next wave)
- CRUX open-world evaluations — `Learning/wiki/concepts/open-world-evaluations.md` (vla-bench is the eval-side companion to Research mode's UX-side bet)
