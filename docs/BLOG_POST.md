# I Ran AI Models Entirely in the Browser — Here's What Actually Works (and What Doesn't)

**Subtitle:** A personal experiment with on-device ML using MediaPipe, WebGPU, and WebAssembly — and the hard lessons about memory, GPU compatibility, and browser limitations that no documentation tells you.

---

Most on-device ML demos show a 135MB model generating "Hello World" and call it a day. I wanted to see if you could actually run real, multi-billion parameter models — Gemma, Qwen, DeepSeek — entirely in a browser tab, with no server, no API keys, and no data leaving the device.

The result is [AI Edge Gallery for Web](https://www.ondeviceml.space): an open-source browser app that downloads, loads, and runs LLMs on-device using Google's MediaPipe + WebGPU. Here's what I built, what broke, and what I'd tell anyone trying to do the same.

---

## Why Browser-Based ML?

The pitch is compelling: zero infrastructure, zero cost, complete privacy. The user downloads a model once, and every subsequent interaction is free and offline. No GPU servers, no API rate limits, no data processing agreements.

But the reality? Browsers weren't designed for ML workloads, so there are real engineering challenges around WebAssembly memory limits, GPU acceleration, and runtime constraints. Understanding these is what makes this interesting.

I wanted to understand these constraints firsthand — not from documentation, but from shipping something real.

![AI Edge Gallery — model gallery](https://www.ondeviceml.space/images/gallery-full.png)

---

## The Architecture: Simpler Than You'd Think

The entire stack is:
- **React 19 + Vite 6** — standard frontend
- **MediaPipe LLM Inference API** — Google's on-device ML runtime (WASM + WebGPU)
- **OPFS** (Origin Private File System) — browser storage that persists across sessions
- **Cloudflare R2** — model file hosting (~$0.15/month)

No backend. No database. No auth. The model downloads from R2 to OPFS once, then inference runs entirely in-browser via WebGPU.

![How It Works — on-device ML pipeline](https://www.ondeviceml.space/images/how-it-works.png)

---

## The "Wow Moment": Real Conversations, Zero Network

The first time I loaded Qwen 2.5 1.5B, asked it to write a fizzbuzz in Python, and watched it stream tokens at 2-4 tok/s with **zero bytes sent to any server** — that was the moment it clicked. The network counter in the corner stayed at 0 the entire time.

This isn't a toy demo. The model understands context, generates structured code, and maintains multi-turn conversations. All running on a Chromebook's integrated Intel GPU.

![Chat interface — on-device inference](https://www.ondeviceml.space/images/chat.png)

---

## Lesson 1: WebAssembly Has a 4GB Ceiling — And It's Not What You Think

The biggest surprise: WASM has a hard 4GB address space limit. Not because of your RAM — my Chromebook has 32GB — but because WASM uses 32-bit addressing. Period.

This means a 2GB model + KV cache + WASM runtime can exceed 4GB and crash with "memory access out of bounds," even if your system has plenty of free memory.

**What I tried that didn't work:**
- `ReadableStreamDefaultReader` for streaming model loading → MediaPipe's WASM calls `self.import()` internally, which Vite's bundler breaks
- `LlmInference.createWebGpuDevice()` for explicit GPU management → same `self.import` error, different code path
- Web Workers to offload MediaPipe → `importScripts()` unavailable in ES module workers

**What actually works:** Plain blob URL loading. Read the model from OPFS as a Blob, create a blob URL, pass it to MediaPipe, revoke immediately after. Simple, boring, reliable.

**Worth noting:** Layer-by-layer streaming can support 7B+ models in the browser, but it currently only works with the older `.bin` format. The newer `.task` format uses a different loading path. As the tooling matures, these will likely converge.

---

## Lesson 2: navigator.deviceMemory Lies

Browsers cap `navigator.deviceMemory` at 8GB for privacy. My 32GB Chromebook reports 8GB. A 16GB MacBook reports 8GB. An actual 8GB device reports 8GB. They're all the same.

**My workaround:** Infer true RAM from Chrome's JS heap limit. If `performance.memory.jsHeapSizeLimit` > 3.5GB, the device almost certainly has 16GB+. Combined with a manual override in the UI, users can set their actual RAM and unlock models that would otherwise be blocked.

![Resource Monitor — memory tracking](https://www.ondeviceml.space/images/quant-explorer.png)

---

## Lesson 3: GPU Compatibility Is the Real Gatekeepr

Some models simply don't work on some GPUs. Not because of memory — because of missing GPU operations.

Qwen 2.5 0.5B, for example, requires the `BROADCAST_TO` GPU operation, which isn't universally available across all hardware. On my Chromebook's Intel iGPU, every transformer block failed to delegate to the GPU — while the same model runs fine on desktop Nvidia GPUs.

Some model-hardware combinations produce unexpected output, which is why compatibility testing is essential for any on-device deployment. The issue isn't model quality — it's the sheer diversity of GPU drivers and supported operation sets across consumer devices.

**What I learned:** You can't assume GPU compatibility. I built a Model Compatibility Test page that auto-downloads each model, loads it, generates one test response, then unloads and deletes — giving a pass/fail for every model on the user's specific hardware.

![Model Compatibility Test — automated pass/fail](https://www.ondeviceml.space/images/model-test.png)

---

## Lesson 4: Repetition Detection Is Harder Than It Sounds

Small models (1-2B parameters) get stuck in loops. "This This This This This..." or "to-to-to-to-to-to" repeating forever. MediaPipe's web API has **no repetition penalty parameter** — only topK, temperature, maxTokens, and randomSeed.

My first detector used 3-gram matching with a threshold of 5. It caught simple loops but missed hyphenated patterns ("to-to-to-to" is one word to a whitespace splitter) and triggered false positives on code (fizzbuzz naturally repeats `if i %`).

**What works:** Two simple checks with high thresholds:
1. 6+ consecutive identical words
2. Same trigram appearing 5+ times in a 60-word window

And critically — put the detection **in the generate wrapper**, not in each page. One global check in `ModelContext.generate()` protects every feature automatically.

---

## Lesson 5: The Models That Actually Work

After testing every model on a 32GB Chromebook with Intel integrated graphics:

| Model | Size | Verdict |
|-------|------|---------|
| **Qwen 2.5 1.5B** | 1.5 GB | Works great — recommended |
| **Gemma 3n E2B** | 2.8 GB | Works great — multimodal (text + image + audio) |
| Gemma 4 E2B | 1.9 GB | WASM memory limit |
| Gemma 3n E4B | 4.1 GB | Too large for WASM |
| SmolLM 135M | 159 MB | Garbled GPU output |
| TinyLlama 1.1B | 1.1 GB | Aborted — GPU op issue |
| Phi-4 Mini | 3.8 GB | Too large for WASM |

The models that work — Qwen 2.5 1.5B and Gemma 3n E2B — deliver genuinely useful on-device inference. As WebGPU matures and WASM Memory64 becomes standard, more models will become browser-compatible.

---

## What I'd Build On Top of This

If you're exploring on-device ML, here's what I think is worth pursuing:

1. **Service Worker model serving** — Intercept fetch requests for model files and stream from OPFS, potentially enabling the layer-by-layer loading that bypasses WASM limits
2. **WASM Memory64** — Chrome 133+ supports 64-bit WASM addressing (up to 16GB). When MediaPipe adopts it, the 4GB ceiling disappears
3. **Hybrid local+cloud** — Route simple queries to the on-device model, complex ones to a cloud API. Best of both worlds
4. **Model fine-tuning in-browser** — LoRA adapters are small enough to train on-device

---

## Try It Yourself

The app is live and the code is open source:

- **Live demo:** [www.ondeviceml.space](https://www.ondeviceml.space)
- **Source code:** [github.com/abhid1234/ai-edge-gallery-web](https://github.com/abhid1234/ai-edge-gallery-web)

Load Gemma 3n E2B, ask it anything, and watch the network counter stay at zero. That part never gets old.

If you're building something similar or have ideas for improvements, I'd love to hear about it. Issues and PRs welcome.

---

*This post is part of my ongoing exploration of AI at the edge. Previously: [I Built an Open-Source AI Agent Framework](https://abhid.substack.com/p/i-built-an-open-source-ai-agent-framework).*
