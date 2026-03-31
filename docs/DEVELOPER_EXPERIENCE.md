# Developer Experience Analysis: On-Device ML for Web

> Friction points, platform gaps, and PM recommendations discovered while building
> a browser-based AI Edge Gallery using MediaPipe LLM Inference + WebGPU.

## Executive Summary

Building a web equivalent of Google's AI Edge Gallery revealed that the on-device ML
web platform is **functional but not yet developer-friendly**. The core inference works,
but the surrounding ecosystem — model hosting, memory management, format compatibility,
and developer documentation — has significant friction that limits adoption.

---

## Friction Points Found

### 1. Model Format Fragmentation

**Problem:** Three model formats exist (`.task`, `.litertlm`, `.tflite`) but no clear
guidance on which to use where.

- MediaPipe `LlmInference` (web) only accepts `.task` bundles
- LiteRT-LM uses `.litertlm` format
- LiteRT.js uses `.tflite` format
- The Gallery's model allowlist mixes both formats across versions

**Impact:** Developers download the wrong format, get "No model format matched" errors,
and waste hours debugging.

**Recommendation:** Standardize on one format per runtime, with clear error messages.
The model card on HuggingFace should indicate which runtimes accept which files.

### 2. Model Gating Creates Onboarding Friction

**Problem:** All Gemma models on HuggingFace are gated. Users must:
1. Create a HuggingFace account
2. Accept the Gemma license on the base model page
3. Accept again on each litert-community derivative
4. Generate a token
5. Use the token in API calls

**Impact:** 5-step process before a developer can even load a model. Most will bounce.

**Recommendation:** Host ungated web-optimized models on a public CDN (like the Gallery's
APK does on Google Play). Or provide a single "accept once" license that covers all derivatives.

### 3. Browser Memory Limits Are Silent Killers

**Problem:** Loading a 3GB model in a browser triggers peak memory of ~6-8GB (blob + GPU buffer).
No browser API warns before allocation fails. The result is either:
- "Array buffer allocation failed" error
- System-wide swap thrashing (entire OS freezes for minutes)

**Impact:** Users lose work, have to hard-restart their machine.

**Recommendation:**
- MediaPipe should check `navigator.deviceMemory` before allocating
- Expose a `estimateMemoryRequired(modelPath)` API
- Support progressive/chunked model loading to reduce peak memory
- Add a `--max-memory` option that caps allocation

### 4. No Session Reset API

**Problem:** MediaPipe's `LlmInference` has no `resetSession()` method. The only way to
clear conversation context is to `close()` and recreate the entire instance — which means
re-loading the model from scratch (10-30 seconds for large models).

**Impact:** "New conversation" takes 30 seconds instead of <1 second.

**Recommendation:** Add `resetSession()` or `clearContext()` to the web API (Android has it).

### 5. WebGPU Coverage Gaps

**Problem:** WebGPU is required for acceptable inference speed, but:
- Firefox: limited support (Windows only as of early 2026)
- Safari: only in Safari 26+ (macOS Tahoe)
- Mobile Chrome: partial support
- Corporate environments: often blocked by policy

**Impact:** ~30% of potential users can't run on-device ML at all.

**Recommendation:** Improve WASM/XNNPack fallback performance so CPU-only devices
get a degraded but functional experience. Currently CPU inference is 10-50x slower.

### 6. Documentation Gaps

**Problem:**
- MediaPipe web LLM docs say the API is "deprecated" but don't clearly state the replacement
- LiteRT-LM web docs exist but the JS API is undocumented
- No migration guide from MediaPipe → LiteRT-LM for web
- Model compatibility matrix doesn't exist (which models work with which runtime)

**Impact:** Developers don't know which API to use or which is the future.

**Recommendation:** Publish a clear "Web ML Runtime Decision Tree":
- If you need LLMs → use LiteRT-LM (future) or MediaPipe (current)
- If you need vision/audio tasks → use LiteRT.js
- If you need both → here's how they interop

### 7. CORS for Model Downloads

**Problem:** Hosting models on any CDN (Cloudflare R2, S3, etc.) requires CORS headers.
HuggingFace's gated model downloads don't include CORS headers by default, so
`fetch()` from a web app fails silently.

**Impact:** Developers think their code is broken when it's actually a CORS issue.

**Recommendation:** The Gallery's model hosting should include `Access-Control-Allow-Origin: *`
for public models. Or provide a recommended CDN setup guide.

---

## What Works Well

1. **MediaPipe streaming callback** — the `generateResponse(prompt, callback)` API is
   intuitive and works reliably for streaming text.

2. **WebGPU performance** — when available, inference is impressively fast. Gemma 1B
   at 40-60 tok/s in a browser is remarkable.

3. **OPFS for model storage** — persisting multi-GB models across sessions works
   flawlessly. The browser truly becomes a local ML runtime.

4. **Cross-platform model files** — the same `.task` file works on Android and web,
   which validates the "ODML everywhere" vision.

5. **Multimodal support** — image and audio input via MediaPipe's prompt parts API
   is well-designed and works in-browser.

---

## Platform Opportunity: Web AI Gallery

The Android AI Edge Gallery has 500K+ downloads. A web version would:
- **Remove installation friction** — just share a URL
- **Reach desktop users** — where WebGPU is best supported
- **Enable instant demos** — no APK sideloading for stakeholders
- **Showcase LiteRT.js + WebGPU** — the team's newest products

The prototype built here proves this is feasible today with the existing MediaPipe
web API. The main blockers are model hosting UX and memory management.

---

## Metrics from This Build

| Metric | Value |
|--------|-------|
| Time to working prototype | ~8 hours |
| Lines of TypeScript | ~3,500 |
| Test coverage | 27 unit tests |
| Models supported | 4 (Gemma 1B, 3n E2B, Qwen 1.5B, DeepSeek R1) |
| Features matching Gallery | 7/7 (Chat, Prompt Lab, Ask Image, Ask Audio, Web Actions, Tiny Garden, Benchmarks) |
| Hosting cost | $0.07/month (Cloudflare R2) |
| Bundle size | 353 KB (gzipped: 114 KB) |
| PWA installable | Yes |
| Dark mode | Yes |

---

*Built by Abhi Das as a side project exploring the ODML web platform.*
*Stack: React 19, Vite 6, TypeScript, Tailwind CSS v4, MediaPipe tasks-genai, WebGPU.*
