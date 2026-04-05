# AI Edge Gallery for Web

A browser-based AI platform that runs large language models entirely on-device via WebGPU. No backend, no API keys, no data leaves your device.

Built as a personal learning project to explore on-device ML in the browser, inspired by [Google's AI Edge Gallery](https://github.com/google-ai-edge/gallery) (Android).

**Live demo:** [ai-edge-gallery-web.vercel.app](https://ai-edge-gallery-web.vercel.app)

## Features

### Core
- **Model Gallery** — Browse, filter, and download models with one-click Run
- **AI Chat** — Multi-turn conversation with streaming, structured output (JSON/Schema), token counter
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
- **Hybrid Local+Cloud** — Conceptual demo of edge/cloud federation routing
- **Resource Monitor** — Live memory usage, GPU estimates, sparkline, RAM override

### Platform
- Cmd+K command bar, dark mode, PWA (installable + offline), memory protection, repetition detection, markdown rendering

## Models

| Model | Size | Author | Best For |
|-------|------|--------|----------|
| Qwen 2.5 1.5B | 1.5 GB | Alibaba | High quality text, multilingual |
| Gemma 3n E2B | 2.8 GB | Google | Multimodal (text + image + audio) |
| Gemma 4 E2B | 1.9 GB | Google | Text + image (needs more memory) |
| Gemma 3n E4B | 4.1 GB | Google | Highest quality multimodal (needs more memory) |

All models are self-hosted on Cloudflare R2.

## Tech Stack

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS v4
- **LLM Runtime:** MediaPipe LLM Inference API (`@mediapipe/tasks-genai`) + WebGPU
- **Model Storage:** OPFS (Origin Private File System) — persists across sessions
- **Model Hosting:** Cloudflare R2 (free egress)
- **Deployment:** Vercel

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

## What I Learned

- WebAssembly has a 4GB address space limit — models + KV cache must fit within this
- MediaPipe's WASM loader uses `self.import()` which Vite's bundler breaks — must use blob URL loading
- `navigator.deviceMemory` caps at 8GB for privacy — need heap limit inference + manual override
- GPU op compatibility varies across devices — some models work on desktop but not Chromebook
- Repetition detection must be global (in the generate wrapper) with high thresholds to avoid false positives on code

## License

MIT
