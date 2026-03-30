export function WebGPUWarning() {
  return (
    <div className="bg-danger/10 border-b border-danger/20 px-6 py-3 text-sm text-danger">
      <strong>WebGPU not available.</strong> This app requires a browser with
      WebGPU support (Chrome 113+, Edge 113+). Models cannot be loaded without
      GPU acceleration.
    </div>
  );
}
