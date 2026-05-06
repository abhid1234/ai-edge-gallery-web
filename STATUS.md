# ondeviceml.space — current status

## Last updated

2026-05-06 — Research mode extracted to `agent.ondeviceml.space`

## Research mode

Moved out of this repo. Now a standalone product at:

- **Live:** https://agent.ondeviceml.space
- **Repo:** https://github.com/abhid1234/agent-ondeviceml

`/research` on this site is a 307 redirect to `agent.ondeviceml.space/research` (preserves query params, including HF deeplinks).

## Phase 6 HF local-apps integration (still in flight)

- **Session 1: "Works With" chips on ModelCard** — shipped
- **Session 2: HF deep-link intake `?hf_model=&task=`** — shipped on GalleryPage
- **Session 3: hub-docs PR** — filed at huggingface.js#2141, awaiting HF review

## Open items

- HF PR #2141 review feedback
- Optional: cross-link from gallery hero pointing visitors to agent.ondeviceml.space
- Optional follow-up PR to point HF `task=research` deeplinks directly at agent subdomain
