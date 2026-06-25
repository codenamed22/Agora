"use client";

import { useState } from "react";

const MAX_BYTES = 2 * 1024 * 1024;
const SIZES = [1024, 800, 640, 512];
const QUALITIES = [0.86, 0.76, 0.66, 0.56, 0.46];

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressImage(file: File) {
  if (file.size <= MAX_BYTES || !file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  let best: Blob | null = null;

  for (const maxSize of SIZES) {
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of QUALITIES) {
      const blob = await canvasBlob(canvas, quality);

      if (!blob) {
        continue;
      }

      best = !best || blob.size < best.size ? blob : best;

      if (blob.size <= MAX_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
      }
    }
  }

  return best
    ? new File([best], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" })
    : file;
}

export default function CompressingImageInput({
  id,
  name,
}: Readonly<{ id: string; name: string }>) {
  const [message, setMessage] = useState("Large images will be compressed before upload.");

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      setMessage("Large images will be compressed before upload.");
      return;
    }

    if (file.size <= MAX_BYTES) {
      setMessage("Ready to upload.");
      return;
    }

    setMessage("Compressing image...");

    try {
      const compressed = await compressImage(file);
      const files = new DataTransfer();
      files.items.add(compressed);
      input.files = files.files;
      setMessage(
        compressed.size <= MAX_BYTES
          ? `Compressed to ${(compressed.size / 1024 / 1024).toFixed(1)}MB.`
          : "Could not compress under 2MB. Try a smaller image.",
      );
    } catch {
      setMessage("Could not compress this image. Try a smaller image.");
    }
  }

  return (
    <>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        required
        onChange={handleChange}
      />
      <small aria-live="polite">{message}</small>
    </>
  );
}
