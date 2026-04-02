# AI Edge Gallery for Web

A browser-based AI platform that runs large language models and vision classifiers entirely on-device via WebGPU. No backend, no API keys, no data leaves your device.

Inspired by [Google's AI Edge Gallery](https://github.com/google-ai-edge/gallery) (Android) — this is the web equivalent, built with MediaPipe LLM Inference + WebGPU.

**Live demo:** [ai-edge-gallery-web.vercel.app](https://ai-edge-gallery-web.vercel.app)

## Features

### Core
- **Model Gallery** — Browse, search, filter, and download 13 models with one-click Run
- **AI Chat** — Multi-turn conversation with streaming, thinking trace, structured output (JSON/Schema), token counter
- **Ask Image** — Multimodal image Q&A with drag-drop upload
- **Ask Audio** — Record or upload audio for transcription and Q&A
- **Prompt Lab** — Template presets, editable system prompts, few-shot examples, custom profiles

### Tools
- **Benchmarks** — TTFT, tokens/sec, speed gauge, model comparison charts
- **Model Compare** — Run same prompt on different models side-by-side
- **Code Complete** — Fill-in-the-middle code completion
- **Token Visualizer** — Real-time token-by-token generation with timing
- **Performance Dashboard** — Live session metrics and per-message stats
- **Embeddings Explorer** — Semantic similarity scoring between texts

### Experiments
- **Web Actions** — On-device function calling (open URLs, search, clipboard, timer)
- **Tiny Garden** — Function-calling mini-game (plant, water, harvest)
- **Tool Sandbox** — Define custom tool schemas, test model function calling
- **Persona Creator** — Build reusable AI characters with custom system prompts
- **Modelfile Editor** — Syntax-highlighted editor with live validation and export
- **Vision Classifier** — Image classification with webcam capture

### Learn
- **How It Works** — Animated pipeline diagram showing the on-device data flow
- **Quantization Explorer** — Interactive tradeoff chart (FP32 vs INT8 vs INT4)
- **Hybrid Local+Cloud** — Conceptual demo of edge/cloud federation routing

### Platform
- Cmd+K command bar, dark mode, PWA (installable + offline), memory protection, sidebar navigation

## Models

### LLM Models (text generation)

| Model | Size | Author | Best For |
|-------|------|--------|----------|
| SmolLM 135M | 159 MB | HuggingFace | Quick experiments, instant load |
| Qwen 2.5 0.5B | 521 MB | Alibaba | Fast text, multilingual |
| Gemma 3 1B | 529 MB | Google | Multi-turn chat |
| TinyLlama 1.1B | 1.1 GB | TinyLlama Project | General purpose |
| Qwen 2.5 1.5B | 1.5 GB | Alibaba | High quality text, multilingual |
| DeepSeek R1 1.5B | 1.7 GB | DeepSeek | Reasoning, chain-of-thought |
| Gemma 3n E2B | 2.8 GB | Google | Multimodal (text + image + audio) |
| Phi-4 Mini | 3.8 GB | Microsoft | Code, math, reasoning |
| Gemma 3n E4B | 4.2 GB | Google | Highest quality multimodal |

### Vision Models (image classification)

| Model | Size | Author |
|-------|------|--------|
| MobileNet V2 | 14 MB | Google |
| MobileNet V3 | 21 MB | Google |
| EfficientNet B1 | 29 MB | Google |
| ResNet-18 | 44 MB | Microsoft Research |

All models are self-hosted on Cloudflare R2 — no HuggingFace account needed.

## Tech Stack

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS v4
- **LLM Runtime:** MediaPipe LLM Inference API (`@mediapipe/tasks-genai`) + WebGPU
- **Model Storage:** OPFS (Origin Private File System) — persists across sessions
- **Model Hosting:** Cloudflare R2 (free egress)
- **Deployment:** Vercel
- **Testing:** Vitest + React Testing Library

## Requirements

- Chrome 113+ or Edge 113+ (WebGPU required)
- 4+ GB available RAM for small models, 8+ GB for multimodal models

## Development

```bash
npm install
npm run dev        # Start dev server
npm test           # Run tests (27 tests)
npm run build      # Production build (101 modules)
```

## Architecture

```
src/
  components/     # Sidebar, Layout, CommandBar, DarkModeToggle, memory tools
  contexts/       # ModelContext (LLM runtime), DownloadContext (OPFS storage)
  features/       # 21 feature-isolated routes (lazy-loaded, code-split)
  hooks/          # useWebGPU detection
  lib/            # MediaPipe wrapper, OPFS storage, model catalog, memory check
  types/          # TypeScript type definitions
```

## How It Works

1. **Download** — Models fetch from Cloudflare R2 CDN to browser OPFS storage
2. **Load** — MediaPipe LLM Inference initializes the model with WebGPU acceleration
3. **Run** — Inference runs entirely in-browser — zero network calls after download
4. **Persist** — Models cached in OPFS, survive browser restarts

Zero bytes sent to any server during inference. Everything is local.

## License

MIT
