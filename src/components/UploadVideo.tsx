// src/components/UploadVideo.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import ProgressIndicator from "@/components/ui/ProgressIndicator";

type SignResponse = {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
};

export default function UploadVideo() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fuerza rehidratación por si este componente se monta sin el layout/menú
  useEffect(() => {
    // @ts-ignore
    useAuth.persist?.rehydrate?.();
  }, []);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

  // 👇 IMPORTANTÍSIMO: leer *siempre* el estado fresco justo al empezar
  const handleVideo = useCallback(async (file: File) => {
    const { hasHydrated, accessToken } = useAuth.getState();
    const ready = hasHydrated && !!accessToken;

    if (!ready) {
      console.warn("Auth no lista aún (hydration/token).");
      return;
    }

    if (!file.type.startsWith("video/")) {
      alert("Por favor, selecciona un archivo de video.");
      return;
    }

    const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_BYTES) {
      toast.error("El límite del archivo no puede superar los 100 MB.", {
        icon: <XCircle className="text-red-500" />,
        duration: 5000,
      });
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setFileName(file.name);
    setProgress(0);
    setUploading(true);

    try {
      // 1) Firma (apiFetch reintenta con refresh si toca)
      const signRes = await apiFetch("/cloudinary/sign/");
      if (!signRes.ok) {
        const txt = await signRes.text();
        throw new Error(`Firma Cloudinary: ${signRes.status} ${txt}`);
      }
      const { cloud_name, api_key, timestamp, signature, folder } =
        (await signRes.json()) as SignResponse;

      // 2) Upload a Cloudinary con progreso
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", api_key);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);

      const cloudUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`;

      const responseJson = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", cloudUrl, true);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
          }
        };
        xhr.onerror = () =>
          reject(new Error("Error de red subiendo a Cloudinary"));
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(json);
            else
              reject(
                new Error(json?.error?.message || "Error al subir a Cloudinary")
              );
          } catch {
            reject(new Error("Respuesta inválida de Cloudinary"));
          }
        };
        xhr.send(form);
      });

      const { secure_url, public_id, format, duration, original_filename } =
        responseJson;

      // 3) Registrar en backend (apiFetch maneja refresh)
      const createRes = await apiFetch("/videos/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: original_filename,
          format,
          file: secure_url,
          public_id,
          duration,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Error creando Video en backend: ${err}`);
      }

      setProgress(100);
      toast.success("¡Video subido y registrado con éxito!", {
        icon: <CheckCircle2 className="text-green-500" />,
        duration: 5000, // ⏱ duración en ms (configurable)
      });
      window.dispatchEvent(new CustomEvent("videopapel:uploaded"));
    } catch (err: any) {
      console.error(err);
      toast.error("Error al subir el video", {
        icon: <XCircle className="text-red-500" />,
        duration: 5000, // ⏱ también configurable
      });
    } finally {
      setUploading(false);
    }
  }, []);

  // 👉 Usa el handle actualizado en los handlers (sin closures “viejas”)
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

      <label htmlFor="video-upload" className="cursor-pointer">
        <Button variant="secondary" asChild>
          <span>Seleccionar archivo</span>
        </Button>
        <input
          ref={inputRef}
          id="video-upload"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={onChange}
          disabled={uploading}
        />
      </label>

      {fileName && (
        <p className="mt-4 text-sm text-gray-700">
          Archivo: <span className="font-medium">{fileName}</span>
        </p>
      )}

      {uploading && <ProgressIndicator label="Subiendo video" progress={progress} />}
    </div>
  );
}
