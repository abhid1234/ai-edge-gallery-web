# ondeviceml.space — Research mode status

Where the Research-mode feature is and what to do next. Update at the end of every working session.

## Last updated

2026-04-29 — feature spec written; no code yet

## Phase status

- ✅ **Phase 0: Decision** — Path A picked over EdgeKit (extension), ModelDeck (web playground), and Path C (thesis-only). Reasoning: don't build a worse subset of what `ondeviceml.space` already has. Add the one thing it lacks — an *agentic workflow primitive*.
- ✅ **Phase 1: Spec** — `docs/features/research-mode.md` written. UX flow + components + reused primitives identified.
- ⏳ **Phase 2: Scaffold** — Create `src/features/research/` with stub components, route, sidebar entry. ~2 hours.
- ⏸️ **Phase 3: Plan-Retrieve-Synthesize loop** — Wire Gemma 270M IT for the planning step + reuse `web-actions` for retrieval + reuse `chat` model for synthesis. ~1 weekend.
- ⏸️ **Phase 4: Polish** — Streaming UI, plan-card visualization, citation rendering, error states. ~1 weekend.
- ⏸️ **Phase 5: Ship** — Deploy to ondeviceml.space, draft LinkedIn post, draft Substack technical writeup. (Per `feedback_social_posts_never_in_git.md`, the LinkedIn/Substack drafts live OUTSIDE git.)

## Resume here next session

**The exact next step: Phase 2 — scaffold the feature directory.**

```bash
cd ~/Core/Workspace/ClaudeCode/ODML
# Open docs/features/research-mode.md and read the "File scaffolding" section.
# It enumerates the exact files to create under src/features/research/.
# Create them as stubs (empty components, type-only exports). Don't implement yet.
# Add the route + sidebar entry per existing feature patterns.
# `npm run dev` should still work; new "Research" tab should appear and render an empty shell.
```

After scaffolding, run `npm run dev`, navigate to the new tab, confirm the shell renders without errors. Commit. Then move to Phase 3.

**If a feature pattern question comes up:** look at `src/features/tool-sandbox/` and `src/features/vision-rag/` first. Those are the closest existing analogs in the codebase; mirror their shape.

## Open questions to resolve before Phase 3

1. **Which model for the planner step?** Gemma 270M IT is the smallest viable. Test on a 1-2 sentence research prompt — does it output structured JSON reliably? If not, fall back to Gemma 1B IT.
2. **What's the retrieval surface?** Two options: (a) reuse `web-actions` for live web fetching, or (b) bundle a tiny static knowledge base (~10MB of pre-indexed text) for offline determinism. Pick based on whether the demo needs to be reproducible across visits.
3. **How many parallel topic workers?** Lyalin has "parallel topic workers" — for v1, single-thread is fine, document this as v2.
4. **Citation format?** Inline `[1]` markers + a citations sidebar? Or footnote-style? Mirror what `vision-rag` does for consistency.

## Decisions log (don't relitigate without reason)

| Date | Decision | Reason |
|------|----------|--------|
| 2026-04-29 | Add Research mode to existing site, not a new project | Already at parity with GemmaDesktop on demo count; gap is workflow primitive, not more demos |
| 2026-04-29 | Reuse `web-actions` + `chat` + `tool-sandbox` instead of building new | "Deepen, not widen" — same pattern as the wiki rule |
| 2026-04-29 | Single-threaded plan→retrieve→synthesize loop in v1 | Lyalin's parallel topic workers are v2; ship simpler first |
| 2026-04-29 | Keep all retrieval/inference 100% on-device | Whole site value prop is "fully offline" — don't break it |
| 2026-04-29 | LinkedIn post + Substack writeup come AFTER feature ships | `feedback_social_posts_never_in_git.md` — drafts live outside repo |
| 2026-04-29 | Don't divert from `vla-bench` | Different lanes, both ship; Research mode is weekend-shaped, vla-bench is multi-month |

## Things I'd flag to a new session

- **Don't propose adding a 25th single-shot demo.** That's regression. The gap is workflow, not demos.
- **Don't propose forking to a desktop app or extension.** The Path-A decision was specifically to keep it in the web sandbox; the web-shape is the differentiator from GemmaDesktop.
- **Don't propose cloud APIs.** The whole site is on-device; cloud breaks the thesis.
- **Don't reinvent web browsing, chat inference, or tool dispatch.** Those exist in `web-actions`, `chat`, `tool-sandbox` respectively — reuse, don't rebuild.
- **Don't violate `feedback_odml_mediapipe_constraints.md`** — `self.import` breaks streaming/WebGPU/Workers. Stick with blob URL pattern when loading new model files.
- **Don't add heavy dependencies** without confirming bundle-size impact. The whole site is supposed to load fast.
