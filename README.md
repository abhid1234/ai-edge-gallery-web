# AI Edge Gallery for Web

A browser-based AI platform that runs large language models entirely on-device via WebGPU. No backend, no API keys, no data leaves your device.

Built as a personal learning project to explore on-device ML in the browser, inspired by [Google's AI Edge Gallery](https://github.com/google-ai-edge/gallery) (Android).

**Live demo:** [www.ondeviceml.space](https://www.ondeviceml.space)
**Blog post:** [I Ran AI Models Entirely in the Browser — Here's What Actually Works](https://abhid.substack.com/p/i-ran-ai-models-entirely-in-the-browser)

---

![AI Edge Gallery — Model Gallery](https://substack-post-media.s3.amazonaws.com/public/images/a6172111-7799-42ee-8b89-9ba1d6bbb272_697x513.png)

## Why Browser-Based ML?

The pitch is compelling: zero infrastructure, zero cost, complete privacy. The user downloads a model once, and every subsequent interaction is free and offline. No GPU servers, no API rate limits, no data processing agreements.

Browsers weren't designed for ML workloads, so there are real engineering challenges around WebAssembly memory limits, GPU acceleration, and runtime constraints. Understanding these is what makes this interesting.

## The Architecture

![Architecture](https://substack-post-media.s3.amazonaws.com/public/images/43a945ac-1dda-4ac7-9726-614a6714abda_863x633.png)

The entire stack is:
- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS v4
- **LLM Runtime:** MediaPipe LLM Inference API (`@mediapipe/tasks-genai`) + WebGPU
- **Model Storage:** OPFS (Origin Private File System) — persists across sessions
- **Model Hosting:** Cloudflare R2 ($0.15/month)
- **Deployment:** Vercel

No backend. No database. No auth. The model downloads from R2 to OPFS once, then inference runs entirely in-browser via WebGPU.

## Features

![Chat Interface](https://substack-post-media.s3.amazonaws.com/public/images/78559260-b269-46d1-b09c-c5a02389bb6a_863x431.png)

### Core
- **Model Gallery** — Browse, filter, and download models with one-click Run
- **AI Chat** — Multi-turn conversation with streaming, structured output (JSON/Schema), markdown rendering
- **Ask Image** — Multimodal image Q&A with drag-drop upload
- **Ask Audio** — Record or upload audio for transcription and Q&A
- **How It Works** — Animated pipeline diagram showing the on-device data flow

### Tools
- **Benchmarks** — TTFT, tokens/sec, speed gauge, model comparison
- **Model Compare** — Run same prompt on different models side-by-side
- **Code Complete** — Fill-in-the-middle code completion
- **Token Visualizer** — Real-time token-by-token generation with timing
- **Performance Dashboard** — Live session metrics and per-message stats
- **Model Test** — Automated compatibility testing for all models

### Advanced
- **Quantization Explorer** — Interactive tradeoff chart (FP32 vs INT8 vs INT4)
- **Resource Monitor** — Live memory usage, GPU estimates, sparkline, RAM override
- **Repetition Detection** — Global client-side detection since MediaPipe has no repetition penalty

## Models

| Model | Size | Author | Best For |
|-------|------|--------|----------|
| **Qwen 2.5 1.5B** | 1.5 GB | Alibaba | High quality text, multilingual |
| **Gemma 3n E2B** | 2.8 GB | Google | Multimodal (text + image + audio) |
| Gemma 4 E2B | 1.9 GB | Google | Text + image (needs more memory) |
| Gemma 3n E4B | 4.1 GB | Google | Highest quality multimodal (needs more memory) |

## What I Learned

![Memory Architecture](https://substack-post-media.s3.amazonaws.com/public/images/782dcb39-4b81-4142-a453-b2bbbce0a679_863x637.png)

### WebAssembly Has a 4GB Ceiling
WASM has a hard 4GB address space limit — not because of your RAM, but because WASM uses 32-bit addressing. A 2GB model + KV cache + runtime can exceed this regardless of system memory.

### navigator.deviceMemory Has a Privacy Cap
Browsers cap `navigator.deviceMemory` at 8GB for privacy. A 32GB machine reports 8GB. Built workarounds using JS heap limit inference and manual RAM override.

![Resource Monitor](https://substack-post-media.s3.amazonaws.com/public/images/b29b0179-fd14-4e14-940a-6fd220e2ce48_863x659.png)

### GPU Compatibility Is a Key Variable
Some models require GPU operations that aren't universally available across hardware. The same model can work on one GPU and not another — which is why automated compatibility testing is essential.

![GPU Compatibility](https://substack-post-media.s3.amazonaws.com/public/images/15c6fd8f-0097-4674-b7a0-2d45a87b53d0_863x519.png)

### Repetition Detection Is a Subtle Challenge
Small models get stuck in loops. MediaPipe's web API has no repetition penalty parameter. Built client-side detection with high thresholds (6+ consecutive words, 5+ trigram repeats) to avoid false positives on code.

![Repetition Detection](https://substack-post-media.s3.amazonaws.com/public/images/208657df-ccbc-4421-b486-fa6e7aa4b56a_863x227.png)

### The Models That Actually Work

![Model Results](https://substack-post-media.s3.amazonaws.com/public/images/126a81e6-0559-4ffe-b0c4-dd65c397bc0e_863x577.png)

The models that work — Qwen 2.5 1.5B and Gemma 3n E2B — deliver genuinely useful on-device inference. As WebGPU matures and WASM Memory64 becomes standard, more models will become browser-compatible.

## What I'd Build On Top of This

![Future Ideas](https://substack-post-media.s3.amazonaws.com/public/images/2d971207-0d3f-41bd-a70d-e129ad85f421_863x848.png)

1. **Service Worker model serving** — Stream from OPFS via service worker to bypass WASM limits
2. **WASM Memory64** — Chrome 133+ supports 64-bit WASM addressing (up to 16GB)
3. **Hybrid local+cloud** — Route simple queries on-device, complex ones to cloud
4. **Model fine-tuning in-browser** — LoRA adapters are small enough to train on-device

## Requirements

- Chrome 113+ or Edge 113+ (WebGPU required)
- Desktop/laptop recommended — mobile browsers have limited memory for AI models
- 4+ GB available RAM for text models, 8+ GB for multimodal models

## Development

```bash
npm install
npm run dev        # Start dev server
npm run build      # Production build
```

## How It Works

1. **Download** — Models fetch from Cloudflare R2 CDN to browser OPFS storage
2. **Load** — MediaPipe LLM Inference initializes the model with WebGPU acceleration
3. **Run** — Inference runs entirely in-browser — zero network calls after download
4. **Persist** — Models cached in OPFS, survive browser restarts

Zero bytes sent to any server during inference. Everything is local.

## Links

- **Live demo:** [www.ondeviceml.space](https://www.ondeviceml.space)
- **Blog post:** [I Ran AI Models Entirely in the Browser](https://abhid.substack.com/p/i-ran-ai-models-entirely-in-the-browser)
- **Subscribe:** [JustCurious on Substack](https://abhid.substack.com)

## License

MIT
