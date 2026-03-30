import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImageUpload } from "../../src/features/ask-image/ImageUpload";

describe("ImageUpload", () => {
  it("renders drop zone with instructions", () => {
    render(<ImageUpload onImageSelected={vi.fn()} />);
    expect(screen.getByText(/drag.*drop.*image/i)).toBeInTheDocument();
  });

  it("renders file input", () => {
    render(<ImageUpload onImageSelected={vi.fn()} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input?.getAttribute("accept")).toContain("image/");
  });
});
