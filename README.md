# AI Edge Gallery for Web

A browser-based AI playground that runs Gemma models locally via WebGPU. No backend, no API keys, no cloud calls.

Built as a web extension of [Google's AI Edge Gallery](https://github.com/google-ai-edge/gallery) (Android).

## Features

- **Model Gallery** -- Browse, download, and manage Gemma models locally in OPFS
- **AI Chat** -- Multi-turn conversation with streaming responses
- **Ask Image** -- Upload an image and ask questions (multimodal, Gemma 3n E2B)
- **Benchmarks** -- Measure TTFT, decode speed, and WebGPU device performance

## Tech Stack

- React 19 + Vite 6 + TypeScript + Tailwind CSS v4
- MediaPipe LLM Inference API (`@mediapipe/tasks-genai`) + WebGPU
- OPFS (Origin Private File System) for persistent model storage
- Vitest + React Testing Library for testing

## Models

| Model | Size | Capabilities |
|-------|------|-------------|
| Gemma 3 270M | ~300 MB | Text |
| Gemma 3 1B | ~500 MB | Text |
| Gemma 3n E2B | ~3 GB | Text + Image + Audio |

All models use int4 quantization and `.litertlm` format optimized for web inference.

## Requirements

- Chrome 113+ or Edge 113+ (WebGPU required)
- 4+ GB available memory for larger models

## Development

```bash
npm install
npm run dev        # Start dev server at localhost:5173/ODML/
npm test           # Run all tests
npm run build      # Production build to dist/
```

## Architecture

```
src/
  contexts/       # ModelContext (LLM runtime), DownloadContext (OPFS storage)
  features/       # Feature-isolated routes (gallery, chat, ask-image, benchmarks)
  hooks/          # Shared hooks (useWebGPU)
  lib/            # Core utilities (mediapipe wrapper, OPFS storage, catalog)
  components/     # Shared UI (Layout, ModelIndicator, WebGPUWarning)
  types/          # TypeScript type definitions
```

Each feature route is lazy-loaded and code-split. The LLM instance lives in a global React context so switching routes doesn't reload the model.

## How It Works

1. Models download from HuggingFace directly to browser OPFS storage
2. MediaPipe LLM Inference API initializes the model with WebGPU acceleration
3. Inference runs entirely in-browser -- zero network calls after model download
4. Models persist across sessions via OPFS

## License

MIT
