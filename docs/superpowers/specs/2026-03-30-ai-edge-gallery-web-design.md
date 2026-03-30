# AI Edge Gallery for Web — Design Spec

## Context

Abhi is interviewing with Sachin Kotwani (GPM, On-Device ML at Google) who leads LiteRT, TensorFlow.js, MediaPipe, and the ODML Developer platform. Sachin's flagship launch is the Google AI Edge Gallery — an open-source Android app (500K downloads, 15.5K stars) that lets users download and run Gemma models locally on-device.

**The gap**: The Gallery is Android-only. Sachin's team is actively pushing web AI via LiteRT.js and MediaPipe JS + WebGPU. A browser-based Gallery extends his flagship product to the web using his team's own stack.

**Goal**: Build a web-based AI Edge Gallery that demonstrates technical depth across Sachin's ODML platform — MediaPipe LLM Inference, WebGPU acceleration, Gemma models, and on-device AI principles (zero cloud, full privacy, offline-capable).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| LLM Runtime | MediaPipe LLM Inference API (`@mediapipe/tasks-genai`) |
| Model Format | `.litertlm` (Web-optimized, int4 quantized) from HuggingFace |
| GPU Acceleration | WebGPU (3x faster than WebGL), WASM/XNNPack fallback |
| Model Storage | OPFS (Origin Private File System) |
| Testing | Vitest + React Testing Library |
| Hosting | GitHub Pages |

---

## Architecture

Single-page React app with React Router. Four lazy-loaded feature routes sharing a global model runtime via React Context.

### Routes

| Path | Feature | Description |
|---|---|---|
| `/` | Model Gallery | Browse, download, and manage models |
| `/chat` | AI Chat | Multi-turn conversation with Gemma |
| `/ask-image` | Ask Image | Multimodal image Q&A with Gemma 3n E2B |
| `/benchmarks` | Benchmarks | Performance metrics dashboard |

### Global Context Layer

- **ModelContext** — Holds the loaded `LlmInference` instance, current model metadata, loading state. The MediaPipe runtime lives here so switching routes doesn't reload the model.
- **DownloadContext** — Tracks download progress for all models, manages OPFS storage, provides download/delete/resume operations.

### Model Lifecycle

1. **Catalog**: `model_catalog.json` defines available models (name, HuggingFace URL, size, capabilities, quantization)
2. **Download**: Fetch from HuggingFace via `fetch()` + `ReadableStream` for progress tracking
3. **Store**: Persist in OPFS — designed for large binary blobs, survives browser restarts
4. **Load**: Read from OPFS, pass to `LlmInference.createFromOptions()`
5. **Switch**: Dispose current instance, load new model from OPFS
6. **Delete**: Remove from OPFS to free space

Model states: `not_downloaded` → `downloading` (with %) → `ready` → `loaded` (active)

Download resilience: Partial downloads stored in OPFS, resumed with HTTP Range headers on retry.

---

## Models

| Model | File | Size | Capabilities |
|---|---|---|---|
| Gemma 3 270M | `gemma-3-270m-it-int4-Web.litertlm` | ~300 MB | Text only (fast) |
| Gemma 3 1B | `gemma-3-1b-it-int4-Web.litertlm` | ~500 MB | Text only (balanced) |
| Gemma 3n E2B | `gemma-3n-E2B-it-int4-Web.litertlm` | ~3 GB | Text + Image + Audio (multimodal) |

---

## Feature Specifications

### Model Gallery (`/`)

- Card grid showing each available model
- Each card: model name, parameter count, size, capabilities (text/multimodal), quantization, download status
- Download button with progress bar (percentage + MB downloaded)
- "Load" button for downloaded models, "Delete" to free space
- Active model highlighted with visual indicator
- WebGPU compatibility check on page load — warning banner if not supported

### AI Chat (`/chat`)

- Multi-turn conversation with history stored in React state
- Streaming responses via MediaPipe's callback-based `generateResponse()`
- Gemma chat template formatting (`<start_of_turn>user\n...<end_of_turn>`)
- "New conversation" button that calls `resetSession()`
- Auto-scroll to latest message
- Markdown rendering for model responses
- Model indicator showing which model is active + decode speed

### Ask Image (`/ask-image`)

- Drag-drop or file picker for image upload (jpg, png, webp)
- Image preview with text prompt input below
- Sends multimodal input to Gemma 3n E2B via MediaPipe's multimodal API
- If user has a text-only model loaded, prompt to download/switch to E2B
- Streaming response rendered below the image

### Live Benchmarks (`/benchmarks`)

- Runs a standardized prompt through the currently loaded model
- Measures: TTFT (time to first token), decode speed (tokens/sec), total inference time
- Model metadata: name, size, quantization, parameter count
- WebGPU device info: GPU adapter name, limits
- Optional WASM backend comparison (same prompt, side-by-side)
- Dashboard with numbers and simple bar charts

---

## Stretch Goals (if time permits)

1. **Prompt Lab** — Single-turn templates (summarize, rewrite, code generation) with Gemma 270M
2. **Function Calling** — Port FunctionGemma to browser: natural language → structured Web API calls
3. **PWA** — Service Worker for offline support, manifest.json for installability

---

## Project Structure

```
ODML/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── model_catalog.json
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── contexts/
│   │   ├── ModelContext.tsx
│   │   └── DownloadContext.tsx
│   ├── hooks/
│   │   ├── useInference.ts
│   │   └── useWebGPU.ts
│   ├── features/
│   │   ├── gallery/
│   │   │   ├── GalleryPage.tsx
│   │   │   ├── ModelCard.tsx
│   │   │   └── DownloadProgress.tsx
│   │   ├── chat/
│   │   │   ├── ChatPage.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── useChatSession.ts
│   │   ├── ask-image/
│   │   │   ├── AskImagePage.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   └── useMultimodal.ts
│   │   └── benchmarks/
│   │       ├── BenchmarksPage.tsx
│   │       ├── MetricsPanel.tsx
│   │       └── useBenchmark.ts
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── ModelIndicator.tsx
│   │   └── WebGPUWarning.tsx
│   ├── lib/
│   │   ├── mediapipe.ts
│   │   ├── storage.ts
│   │   └── catalog.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── features/
│   │   ├── gallery.test.tsx
│   │   ├── chat.test.tsx
│   │   ├── ask-image.test.tsx
│   │   └── benchmarks.test.tsx
│   └── lib/
│       ├── storage.test.ts
│       └── catalog.test.ts
└── README.md
```

---

## Testing Strategy

### Unit Tests (Vitest)

- `lib/catalog.ts` — model catalog parsing, filtering by capability
- `lib/storage.ts` — OPFS read/write/delete operations (mocked OPFS API)
- Feature hooks — `useChatSession`, `useBenchmark`, `useMultimodal` logic

### Component Tests (Vitest + React Testing Library)

- `ModelCard` — renders correct states (not_downloaded, downloading, ready, loaded)
- `MessageList` — renders conversation history, handles streaming
- `ImageUpload` — drag-drop and file picker interactions
- `MetricsPanel` — displays benchmark data correctly

### Integration Tests (Vitest)

- `ModelContext` — model load/switch/dispose lifecycle
- `DownloadContext` — download start/progress/complete/resume flow

### What We Mock

The `LlmInference` interface is mocked in tests. Real MediaPipe inference requires WebGPU and a model file — verified manually in Chrome.

### Manual Verification Checklist

- [ ] Gemma 1B loads and streams text in Chrome with WebGPU
- [ ] Gemma 3n E2B processes image + text multimodal queries
- [ ] Models persist across browser sessions via OPFS
- [ ] Download progress bar works, download resumes after interruption
- [ ] Benchmark panel shows real TTFT and tokens/sec numbers
- [ ] WebGPU warning shows in browsers without WebGPU support

---

## Interview Talking Points

1. **"I built the web version of your flagship product"** — The Gallery is Android-only; this extends it to web using MediaPipe JS + WebGPU, which Chintan presented at the Web AI Summit.
2. **"Same models, same runtime, new platform"** — Gemma 3n `.litertlm` files work on Android AND web. The ODML "everywhere" vision.
3. **"Developer experience gaps I found"** — Document friction points in the web pipeline (model download UX, WebGPU detection, memory limits).
4. **"Zero cloud, full privacy"** — No backend, no API keys. Models cached locally via OPFS. Works offline after first download.
5. **Performance data** — "Gemma 270M at 137 t/s in Chrome. 1B at 60 t/s. Here are the WebGPU vs WASM numbers."
6. **"On-device function calling in the browser"** (if stretch goal completed) — FunctionGemma running in Chrome, executing web APIs.

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `@mediapipe/tasks-genai` | MediaPipe LLM Inference for Web |
| `tailwindcss`, `@tailwindcss/typography` | Styling |
| `vite`, `@vitejs/plugin-react` | Build tool |
| `vitest`, `@testing-library/react` | Testing |
| `typescript` | Type safety |
