// src/components/UploadVideo.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, UploadCloud, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import ProgressIndicator from "@/components/ui/ProgressIndicator";
import { Modal } from "@/components/ui/Modal";

type UploadUrlResponse = {
  upload_url: string;
  object_name: string;
  public_url: string;
};

async function getVideoMetadata(file: File): Promise<{
  duration_ms: number;
  width_px: number | null;
  height_px: number | null;
  format: string | null;
}> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("No se pudo leer metadata del video"));
    });

    const duration_ms = Math.round(video.duration * 1000);
    const width_px = video.videoWidth || null;
    const height_px = video.videoHeight || null;

    // formato desde mimetype o extensión
    const formatFromType = file.type?.split("/")[1] || null;
    const ext = file.name.split(".").pop()?.toLowerCase() || null;
    const format = formatFromType || ext;

    return { duration_ms, width_px, height_px, format };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function UploadVideo() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // @ts-ignore
    useAuth.persist?.rehydrate?.();
  }, []);

  const handleVideo = useCallback(async (file: File) => {
    const { hasHydrated, accessToken } = useAuth.getState();
    if (!(hasHydrated && accessToken)) {
      console.warn("Auth no lista aún (hydration/token).");
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast.error("Por favor, selecciona un archivo de video.");
      return;
    }

    const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_BYTES) {
      toast.error("El límite del archivo no puede superar los 100 MB.", {
        icon: <XCircle className="text-red-500" />,
        duration: 5000,
      });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFileName(file.name);
    setProgress(0);
    setUploading(true);
    setProgressModalOpen(true);

    try {
      // 1) Pedir signed upload URL a backend
      const signRes = await apiFetch("/videos/upload-url/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "application/octet-stream",
        }),
      });

      if (!signRes.ok) {
        const txt = await signRes.text();
        throw new Error(`Signed URL: ${signRes.status} ${txt}`);
      }

      const { upload_url, object_name, public_url } =
        (await signRes.json()) as UploadUrlResponse;

      // 2) Subir directo a GCS con PUT (progreso)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
          }
        };

        xhr.onerror = () => reject(new Error("Error de red subiendo a GCS"));
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`GCS error ${xhr.status}: ${xhr.responseText}`));
        };

        xhr.send(file);
      });

      // 3) Leer metadata local del vídeo
      const meta = await getVideoMetadata(file);

      // 4) Confirmar al backend para crear Video
      const completeRes = await apiFetch("/videos/upload-complete/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object_name,
          file_url: public_url,
          thumbnail_url: null,
          public_url,
          content_type: file.type || "application/octet-stream",
          duration_ms: meta.duration_ms,
          width_px: meta.width_px,
          height_px: meta.height_px,
          format: meta.format,
          title: file.name.replace(/\.[^/.]+$/, ""),
        }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.text();
        throw new Error(`upload-complete backend: ${err}`);
      }

      setProgress(100);
      toast.success("¡Video subido y registrado con éxito!", {
        icon: <CheckCircle2 className="text-green-500" />,
        duration: 5000,
      });

      window.dispatchEvent(new CustomEvent("videopapel:uploaded"));
      setProgressModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error al subir el video", {
        icon: <XCircle className="text-red-500" />,
        duration: 5000,
      });
      setProgressModalOpen(false);
    } finally {
      setUploading(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleVideo(file);
    },
    [handleVideo]
  );
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleVideo(f);
    },
    [handleVideo]
  );

  return (
    <div
      className={[
        "flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 w-full max-w-xl transition-colors",
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white",
      ].join(" ")}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <UploadCloud className="h-12 w-12 text-gray-500 mb-3" />
      <p className="text-gray-700 font-medium">Arrastra tu video aquí</p>
      <p className="text-gray-500 text-sm mb-4">
        o haz clic para seleccionar un archivo. Máximo 100 Mb.
      </p>

      {/* <Button
        type="button"
        className="inline-flex items-center justify-center px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-700 hover:text-white font-semibold rounded-lg shadow-md transition-colors"
        onClick={() => {
          if (!uploading) inputRef.current?.click()
        }}
        disabled={uploading}
      >
        <Upload className="w-5 h-5 mr-2" />
        <span>Añadir nuevo video</span>
      </Button> */}
      <input
        ref={inputRef}
        id="video-upload"
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onChange}
        disabled={uploading}
      />

      {fileName && (
        <p className="mt-4 text-sm text-gray-700">
          Archivo: <span className="font-medium">{fileName}</span>
        </p>
      )}

      <Modal
        open={progressModalOpen}
        onClose={() => {
          if (!uploading) setProgressModalOpen(false);
        }}
        closeOnOverlay={false}
        size="sm"
        title="Subiendo video"
      >
        <ProgressIndicator label="Subiendo video" progress={progress} />
      </Modal>
    </div>
  );
}
