/**
 * WebNN Learning Notes — an open learning journal.
 * Not a polished blog post; captures what I learned while exploring the
 * WebNN + Transformers.js space. Intended as a link to share with anyone
 * looking at this as a 20% project.
 */

export function Component() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-primary)" }}>
          Learning Journal
        </p>
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-on-surface)" }}>
          WebNN + Transformers.js: first impressions
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Open notes from a few days of digging in. Not polished &mdash; just what stuck.
        </p>
      </div>

      <Section title="What WebNN actually is">
        <p>
          WebNN is a W3C standard that gives web apps direct access to on-device neural
          network accelerators. Think of it as a peer to WebGPU, but purpose-built for ML
          inference and capable of targeting NPU silicon that general GPU APIs can&rsquo;t
          reach.
        </p>
        <p className="mt-3">
          The simple mental model I landed on:
        </p>
        <ul className="mt-2 ml-5 space-y-1 list-disc">
          <li><strong>WASM</strong> &mdash; CPU fallback. Works everywhere, slowest.</li>
          <li><strong>WebGPU</strong> &mdash; general GPU compute. Broadly supported. Good for most models.</li>
          <li><strong>WebNN</strong> &mdash; ML-specific. Can target NPUs (Intel AI Boost, Qualcomm Hexagon, Apple Neural Engine) that WebGPU can&rsquo;t touch. Potentially much faster on hardware that has an NPU.</li>
        </ul>
      </Section>

      <Section title="Current state (April 2026)">
        <ul className="space-y-2 ml-5 list-disc">
          <li>
            <strong>Spec:</strong> W3C Candidate Recommendation as of January 22, 2026.
            Comment period ran through March 22, 2026.
          </li>
          <li>
            <strong>Chrome 147:</strong> Available behind the flag{" "}
            <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--color-surface-container)" }}>
              #web-machine-learning-neural-network
            </code>
            . Origin Trial active through M-149.
          </li>
          <li>
            <strong>Hardware:</strong> Intel NPUs (Core Ultra / MTL), Qualcomm Hexagon
            (Copilot+ PCs), Apple Neural Engine via Core ML backend (in progress).
          </li>
          <li>
            <strong>Backends:</strong> ONNX Runtime Web EP is the primary path on Windows,
            Core ML on macOS, TFLite/XNNPACK on Linux/Android.
          </li>
          <li>
            <strong>Ops:</strong> The spec has 95 operators. Backend coverage is around 90%
            across the main implementations.
          </li>
        </ul>
      </Section>

      <Section title="Three things I didn't expect">
        <ol className="space-y-3 ml-5 list-decimal">
          <li>
            <strong>The spec is driven by Intel, not Google.</strong> Ningxin Hu from
            Intel is the principal spec author and editor. Google Chrome is a supporting
            participant in the W3C Web ML WG, not the driver. That&rsquo;s different from
            my assumption that WebNN was a Google-led effort, and it helps explain why
            Intel NPU support is so mature compared to other hardware.
          </li>
          <li>
            <strong>No dynamic shapes.</strong> WebNN doesn&rsquo;t support dynamic
            dimensions the way ONNX Runtime on native CPU does. You have to pre-define
            every shape via{" "}
            <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--color-surface-container)" }}>
              freeDimensionOverrides
            </code>{" "}
            before loading the model. This is the single biggest adoption friction point
            I ran into &mdash; every tutorial I read eventually hit this wall.
          </li>
          <li>
            <strong>Transformers.js already has a WebNN backend &mdash; it&rsquo;s just
            undocumented.</strong> You can pass{" "}
            <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--color-surface-container)" }}>
              device: &rsquo;webnn&rsquo;
            </code>{" "}
            (or{" "}
            <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--color-surface-container)" }}>
              &rsquo;webnn-npu&rsquo;
            </code>
            ) to any pipeline since v3, but there&rsquo;s no mention of it in the official
            Transformers.js docs. Developers hitting this for the first time get zero
            guidance.
          </li>
        </ol>
      </Section>

      <Section title="Gaps I noticed">
        <p className="mb-3">
          Each of these looks like a tractable contribution for a 20% project:
        </p>
        <ol className="space-y-2 ml-5 list-decimal">
          <li>
            <strong>No WebNN section in the Transformers.js docs.</strong> The backend
            exists but isn&rsquo;t mentioned in the guide, the API reference, or the
            tutorials.
          </li>
          <li>
            <strong>No WebNN demo apps in{" "}
            <code className="text-[11px]">transformers.js-examples</code>.</strong> Every
            sample app uses WebGPU. There&rsquo;s nothing that showcases the WebNN path
            end-to-end.
          </li>
          <li>
            <strong>No public benchmark.</strong> I couldn&rsquo;t find a single apples-to-apples
            comparison of WebNN vs WebGPU vs WASM running the same model on the same
            hardware. Developers trying to decide have nothing to point at.
          </li>
          <li>
            <strong>No model compatibility matrix.</strong> Which Transformers.js models
            actually work on WebNN, and what{" "}
            <code className="text-[11px]">freeDimensionOverrides</code> do they need? There
            isn&rsquo;t a list anywhere.
          </li>
          <li>
            <strong>IoT / edge is underexplored.</strong> WebNN is a browser API, but
            embedded Chromium (Tauri, Electron, CEF) opens it up to edge devices. I
            couldn&rsquo;t find anyone doing this yet.
          </li>
        </ol>
      </Section>

      <Section title="Questions I still have">
        <ol className="space-y-2 ml-5 list-decimal">
          <li>
            Is the plan for Transformers.js to surface WebNN more prominently once the
            spec reaches Proposed Recommendation, or is it waiting on broader browser
            adoption first?
          </li>
          <li>
            How much of the NPU gap (BROADCAST_TO, QDQ, dynamic shapes) is expected to
            close in the next 12 months vs being a longer-term architectural constraint?
          </li>
          <li>
            Where does the ONNX Runtime Web team see the biggest friction for developers
            adopting the WebNN execution provider today?
          </li>
        </ol>
      </Section>

      <Section title="What I built alongside these notes">
        <p>
          A small prototype that loads Transformers.js dynamically, tries{" "}
          <code className="text-[11px]">webnn</code> first, falls back to{" "}
          <code className="text-[11px]">webgpu</code>, then <code className="text-[11px]">wasm</code>.
          Reports which backend actually ran and the median inference time. It&rsquo;s the
          minimum that felt honest to ship before writing any of this up.
        </p>
        <div className="mt-3">
          <a
            href="/webnn-test"
            className="text-xs font-semibold px-3 py-1.5 rounded-full inline-block"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            &rarr; Try the prototype
          </a>
        </div>
      </Section>

      <div
        className="rounded-xl p-4 text-xs"
        style={{
          backgroundColor: "var(--color-surface-container)",
          color: "var(--color-outline)",
          border: "1px solid var(--color-outline-variant)",
        }}
      >
        These notes are deliberately rough. If you spot something wrong, I&rsquo;d love to
        hear about it &mdash; see the GitHub repo for contact.
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-xl p-5"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-outline-variant)",
      }}
    >
      <h3 className="text-base font-bold mb-3" style={{ color: "var(--color-on-surface)" }}>
        {title}
      </h3>
      <div
        className="text-sm leading-relaxed"
        style={{ color: "var(--color-on-surface-variant)" }}
      >
        {children}
      </div>
    </section>
  );
}
