// src/components/MyProjects.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/store/auth";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import { toast } from "sonner";
import { Share2, ExternalLink } from "lucide-react";
import { ShareConfirmationModal } from "@/components/ShareConfirmationModal";
import { ShareModal } from "@/components/ShareModal";
import { DateFormat } from "@/components/DateFormat";
import DuplicateProjectButton from "@/components/DuplicateProjectButton";
import ProjectPrivacyBadge from "@/components/project/ProjectPrivacyBadge";
import StatusBadge from "@/components/project/StatusBadge";

type Project = {
  id: string;
  name: string | null;
  status: "draft" | "ready" | "exported";
  created_at: string;
  updated_at: string;
  is_public: boolean;
  duplicate_of: string | null;
  duplicate_of_name?: string | null;
  clip_count: number;
  print_size_label?: string | null;
  orientation_name?: string | null;
  effect_name?: string | null;

  primary_clip?: {
    clip_id: number;
    frame_time_ms: number;
    video_url: string;

    // ✅ PRO: thumbnails ya generadas por worker (GCS/CDN)
    thumbnails?: {
      image_url: string;        // URL directa a la miniatura (jpg/png)
      frame_time_ms?: number;   // opcional, por si lo quieres mostrar/debug
      video_url?: string;       // opcional
    }[];
  } | null;
};

export type { Project };

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para la modal de CONFIRMACIÓN (hacer público)
  const [shareConfirmationProject, setShareConfirmationProject] =
    useState<Project | null>(null);

  // Estado para la modal de COMPARTIR (redes sociales)
  const [sharePublicProject, setSharePublicProject] = useState<Project | null>(
    null
  );

  const [sharingId, setSharingId] = useState<string | null>(null);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
  const hasHydrated = useAuth((s) => s.hasHydrated);
  const accessToken = useAuth((s) => s.accessToken);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setProjects(data?.results ?? data);
    } catch (e: any) {
      setError(e.message || "Error al cargar tus proyectos");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, accessToken]);

  useEffect(() => {
    if (!hasHydrated || !accessToken) return;
    fetchProjects();
  }, [hasHydrated, accessToken, fetchProjects]);

  useEffect(() => {
    const handler = () => fetchProjects();
    window.addEventListener("videopapel:project:changed", handler);
    return () => {
      window.removeEventListener("videopapel:project:changed", handler);
    };
  }, [fetchProjects]);

  const shareProject = useCallback(async (project: Project) => {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/clips/${project.id}`;
    setSharingId(project.id);
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.name || "Proyecto de VideoPapel",
          text: "Mira este proyecto en VideoPapel",
          url: shareUrl,
        });
        toast.success("Proyecto compartido correctamente (vía nativa).");
      } else {
        setSharePublicProject(project);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setSharePublicProject(project);
      toast.info("Abriendo opciones de compartición...");
    } finally {
      setSharingId(null);
    }
  }, []);

  const handleShareClick = useCallback((project: Project) => {
    if (!project.is_public) {
      setShareConfirmationProject(project);
      return;
    }
    setSharePublicProject(project);
  }, []);

  const handleMakePublic = useCallback(
    async (project: Project) => {
      if (!accessToken) return;
      const projectId = project.id;
      setUpdatingPrivacy(true);
      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({ is_public: true }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Error ${res.status}`);
        }
        const updated = (await res.json()) as Project;
        setProjects((prev) =>
          prev.map((proj) =>
            proj.id === projectId ? { ...proj, is_public: true } : proj
          )
        );
        toast.success(
          "El proyecto ahora es público. Abriendo opciones para compartir."
        );

        setShareConfirmationProject(null);
        setUpdatingPrivacy(false);
        setSharePublicProject(updated);
      } catch (err: any) {
        toast.error(err?.message || "No se pudo actualizar la privacidad.");
      } finally {
        setUpdatingPrivacy(false);
      }
    },
    [API_BASE, accessToken]
  );

  if (!hasHydrated) return <p className="text-gray-500">Preparando…</p>;
  if (!accessToken)
    return (
      <p className="text-gray-500">Inicia sesión para ver tus proyectos.</p>
    );
  if (loading) return <p className="text-gray-500">Cargando…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!projects.length)
    return <p className="text-gray-500">Aún no tienes proyectos.</p>;

  return (
    <>
      <section className="w-full">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <li
              key={p.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              {p.primary_clip && p.primary_clip.video_url && (
                <div className="bg-gray-100">
                  <div className="grid grid-cols-2 gap-0.5 aspect-video overflow-hidden">
                    {(p.primary_clip.thumbnails?.length
                      ? p.primary_clip.thumbnails
                      : [
                          {
                            image_url: "/img/thumb-placeholder.jpg",
                            frame_time_ms: p.primary_clip.frame_time_ms,
                            video_url: p.primary_clip.video_url,
                          },
                        ]
                    )
                      .slice(0, 4)
                      .map((thumb, idx) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={`${p.id}-thumb-${idx}`}
                          src={thumb.image_url || "/img/thumb-placeholder.jpg"}
                          alt={`Miniatura ${idx + 1} de ${p.name || p.id}`}
                          className="h-full w-full object-cover"
                        />
                      ))}
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold truncate">
                    {p.name || `Proyecto #${p.id}`}
                  </h3>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <ProjectPrivacyBadge isPublic={p.is_public} compact />
                  <StatusBadge status={p.status} compact />
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  {p.clip_count} {p.clip_count === 1 ? "clip" : "clips"}
                  {p.print_size_label ? ` • ${p.print_size_label}` : ""}
                  {p.orientation_name ? ` • ${p.orientation_name}` : ""}
                  {p.effect_name ? ` • efecto: ${p.effect_name}` : ""}
                </p>

                <DateFormat
                  date={p.created_at}
                  isDuplicated={!!p.duplicate_of}
                />

                {p.duplicate_of && (
                  <p className="text-xs text-gray-400 mt-1">
                    <Link
                      href={`/projects/${p.duplicate_of}`}
                      className="font-medium text-purple-600 hover:text-purple-400"
                    >
                      Proyecto duplicado de{" "}
                      {p.duplicate_of_name || p.duplicate_of}
                    </Link>
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/projects/${p.id}`}
                    className="px-3 py-1.5 text-xs rounded-lg bg-blue-200 text-black hover:bg-blue-700 flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Abrir
                  </Link>

                  <DuplicateProjectButton
                    projectId={p.id}
                    size="compact"
                    onDuplicated={(clone) => {
                      setProjects((prev) => [clone as Project, ...prev]);
                    }}
                    onError={setError}
                    title="Duplicar proyecto"
                  />

                  <button
                    type="button"
                    onClick={() => handleShareClick(p)}
                    disabled={sharingId === p.id}
                    title="Compartir proyecto"
                    className="
                      px-3 py-1.5 text-xs rounded-lg bg-purple-100 text-black hover:bg-gray-50
                      disabled:opacity-60 disabled:cursor-not-allowed
                      flex items-center justify-center gap-1
                    "
                  >
                    <Share2 className="w-3 h-3" />
                    Compartir
                  </button>
                </div>

                <DeleteProjectButton
                  projectId={p.id}
                  projectName={p.name}
                  disabled={p.status === "exported"}
                  onDeleted={() => {
                    setProjects((prev) =>
                      prev.filter((proj) => proj.id !== p.id)
                    );
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Modal de Confirmación (Privado -> Público) */}
      <ShareConfirmationModal
        project={shareConfirmationProject}
        onClose={() =>
          updatingPrivacy ? undefined : setShareConfirmationProject(null)
        }
        onMakePublic={handleMakePublic}
        isUpdating={updatingPrivacy}
      />

      {/* Modal de Compartir (Público -> Redes Sociales) */}
      <ShareModal
        project={sharePublicProject}
        onClose={() => setSharePublicProject(null)}
      />
    </>
  );
}
