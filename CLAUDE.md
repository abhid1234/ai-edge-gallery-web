# CLAUDE.md — ondeviceml.space project context

## What this is

`ondeviceml.space` ("AI Edge Gallery for Web") — Abhi's flagship on-device AI showcase. 24+ in-browser demos running entirely client-side via MediaPipe / WebGPU / WebNN / Transformers.js. No cloud, no install, no account.

This is the **public artifact** that anchors his ODML / LiteRT / Chintan track at Google Cloud.

Sister sites:
- `bench.ondeviceml.space` — Web AI Bench (runtime comparison harness), separate repo at `~/Core/Workspace/ClaudeCode/web-ai-bench/`
- `agent.ondeviceml.space` — ondeviceml/research (agentic browsing in your browser), separate repo at `~/Core/Workspace/ClaudeCode/agent-ondeviceml/`. The `/research` route on this site is a 307 redirect to that subdomain.

## Hard constraints — DO NOT VIOLATE

1. **Stay on-device.** No cloud APIs in the hot path. WebGPU/WebNN/MediaPipe only. The whole site's value prop is "fully offline."
2. **Don't divert from vla-bench.** Abhi has a parallel `vla-bench` project (`~/Core/Workspace/ClaudeCode/vla-bench/`) with a $50 hard budget and multi-month timeline.
3. **No social/launch/marketing files in git.** Per `feedback_social_posts_never_in_git.md`. Drafts live outside the repo.
4. **Research mode lives in `agent-ondeviceml`, not here.** Don't add it back to this repo.

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
│   └── ... (21 more)
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

## Source-paper anchors (already in his Learning wiki)

- a16z continual learning — `Learning/wiki/concepts/continual-learning.md` (frames why on-device matters for the next wave)
- CRUX open-world evaluations — `Learning/wiki/concepts/open-world-evaluations.md` (vla-bench is the eval-side companion to Research mode's UX-side bet)
