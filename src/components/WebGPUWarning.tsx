export function WebGPUWarning() {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
      style={{
        backgroundColor: "var(--color-warning-container)",
        color: "var(--color-warning)",
      }}
    >
      {/* Warning icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="flex-shrink-0 mt-0.5"
      >
        <path d="M1 21L12 2l11 19H1zm11-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-1-3h2v-4h-2v4z" />
      </svg>

      <div>
        <span className="font-bold">WebGPU not available.</span>{" "}
        This app requires a browser with WebGPU support (Chrome 113+, Edge 113+). Models cannot be
        loaded without GPU acceleration.
      </div>
    </div>
  );
}
