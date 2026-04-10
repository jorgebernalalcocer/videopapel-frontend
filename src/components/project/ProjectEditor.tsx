// src/components/ProjectEditor.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import EditingCanvas from "@/components/project/EditingCanvas";
import VideoPickerModal, {
  type VideoItem,
} from "@/components/project/VideoPickerModal";
import FramePickerModal, {
  type FramePickerItem,
} from "@/components/project/FramePickerModal";
import QualitySelector from "@/components/project/QualitySelector";
import PrintQualityBadge from "@/components/project/PrintQualityBadge";
import SizeSelector from "@/components/project/SizeSelector";
import PrintSizeBadge from "@/components/project/PrintSizeBadge";
import SelectableBadgeWrapper from "@/components/ui/SelectableBadgeWrapper";
import PrintOrientationBadge from "@/components/project/PrintOrientationBadge";
import OrientationSelector from "@/components/project/OrientationSelector";
import PrintEffectBadge from "@/components/project/PrintEffectBadge";
import EffectsTile, {
  type EffectPreviewClip,
} from "@/components/project/EffectsTile";
import ProjectPrivacyBadge from "@/components/project/ProjectPrivacyBadge";
import PrivacySelector from "@/components/project/PrivacySelector";
import PrintAspectBadge from "@/components/project/PrintAspectBadge";
import AspectSelector from "@/components/project/AspectSelector";
import PrintBindingBadge from "@/components/project/PrintBindingBadge";
import BindingSelector from "@/components/project/BindingSelector";
import StatusBadge from "@/components/project/StatusBadge";
import PrintSheetPaperBadge from "./PrintSheetPaperBadge";
import PrintSheetPaperSelector from "@/components/project/PrintSheetPaperSelector";
import type { FrameSettingClient } from "@/types/frame";
import type { PageEnumerationSettingClient } from "@/types/pageEnumeration";
import { toast } from "sonner";
import { useProjectPdfExport } from "@/hooks/useProjectPdfExport";
import DuplicateProjectButton from "@/components/DuplicateProjectButton";
import ShareProjectButton from "@/components/ShareProjectButton";
import { ShareModal } from "@/components/ShareModal";
import EditTitleModal from "@/components/project/EditTitleModal";
import PrintStylePresetPdfModal from "@/components/project/PrintStylePresetPdfModal";
import { SquarePen } from "lucide-react";
import {
  ProjectPriceCard,
  type PriceBreakdown,
} from "@/components/pricing/ProjectPriceCard";
import { Modal } from "@/components/ui/Modal";

/* =========================
   Tipos
========================= */

type ClipThumbnail = {
  image_url: string;
  frame_time_ms: number;
};

type ProjectClipPayload = {
  id: number;
  video_url: string;
  duration_ms: number;
  frames?: number[] | null;
  thumbnails?: ClipThumbnail[] | null;
  time_start_ms?: number | null;
  time_end_ms?: number | null;
  position?: number | null;
};

type Project = {
  id: string;
  name: string | null;
  owner_id: number;
  owner_email?: string | null;
  owner_name?: string | null;
  current_user_role?: "owner" | "edit" | "view" | null;
  current_user_can_edit?: boolean;
  current_user_can_manage_sharing?: boolean;
  status: "draft" | "ready" | "exported";
  created_at: string;
  updated_at?: string;
  print_quality_id?: number | null;
  print_quality_name?: string | null;
  print_quality_dpi?: number | null;
  print_quality_ppi?: number | null;
  print_size_id?: number | null;
  print_size_label?: string | null;
  print_size_width_mm?: number | null;
  print_size_height_mm?: number | null;
  print_orientation_id?: number | null;
  print_orientation_label?: string | null;
  print_orientation_type?: "vertical" | "horizontal" | "cuadrado" | null;
  print_effect_id?: number | null;
  print_effect_label?: string | null;
  primary_clip?: ProjectClipPayload | null;
  is_public?: boolean;
  print_aspect_id?: number | null;
  print_aspect_name?: string | null;
  print_aspect_slug?: string | null;
  thumbs_per_second?: number | null;
  frame_id?: number | null;
  frame_name?: string | null;
  frame_description?: string | null;
  frame_setting?: FrameSettingClient;
  page_enumeration_setting?: PageEnumerationSettingClient;
  print_binding_id?: number | null;
  print_binding_name?: string | null;
  print_binding_description?: string | null;
  print_sheet_paper_id?: number | null;
  print_sheet_paper_label?: string | null;
  print_sheet_paper_weight?: number | null;
  print_sheet_paper_finishing?: string | null;
  cover_image?: {
    id: number;
    project_clip_id: number;
    video_id: number;
    frame_time_ms: number;
    image_url: string | null;
    video_url: string | null;
  } | null;
};

type ProjectPricePreview = {
  project_id: string;
  project_name: string;
  quantity: number;
  total_pages: number;
  unit_price: string;
  line_total: string;
  print_size_label?: string | null;
  price_breakdown?: PriceBreakdown | null;
};

const parseMoney = (value?: string | number | null): number => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: number): string => value.toFixed(2);

const isShippingLine = (
  line: PriceBreakdown["line_items"][number],
): boolean => {
  return line.kind === "shipping" || /gastos de env[ií]o/i.test(line.label);
};

const resolveClipPreview = (
  clip?: ProjectClipPayload | null,
): EffectPreviewClip | null => {
  if (!clip) return null;

  const firstThumb =
    clip.thumbnails && clip.thumbnails.length > 0 ? clip.thumbnails[0] : null;

  if (firstThumb?.image_url) {
    return {
      videoUrl: clip.video_url ?? null,
      frameTimeMs: firstThumb.frame_time_ms,
      imageUrl: firstThumb.image_url,
      image_url: firstThumb.image_url,
      url: firstThumb.image_url,
    };
  }

  return null;
};

const STATUS_LABELS: Record<Project["status"], string> = {
  draft: "Elaborando",
  ready: "Listo",
  exported: "Comprado",
};

interface ProjectEditorProps {
  projectId: string; // UUID del proyecto
}

/* =========================
   Componente
========================= */

export default function ProjectEditor({ projectId }: ProjectEditorProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [clips, setClips] = useState<ProjectClipPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [effectsModalOpen, setEffectsModalOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [creatingClip, setCreatingClip] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [editTitleOpen, setEditTitleOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [advancedPdfModalOpen, setAdvancedPdfModalOpen] = useState(false);
  const statusLabel = project
    ? (STATUS_LABELS[project.status] ?? project.status)
    : null;
  const isProjectExported = project?.status === "exported";
  const currentUser = useAuth((s) => s.user);
  // 1. Definición de variables de campos incompletos (usan const y ; al final)
  //    Se utiliza el cortocircuito lógico (&&) para que la variable sea el string o false/undefined.
  const qualityNotCompleted =
    project && !project.print_quality_id ? "Calidad de imagen" : null;
  const sizeNotCompleted =
    project && !project.print_size_id ? "Tamaño de impresión" : null;
  const orientationNotCompleted =
    project && !project.print_orientation_id
      ? "Orientación de impresión"
      : null;
  const aspectNotCompleted =
    project && !project.print_aspect_id ? "Posición de impresión" : null;
  const bindingNotCompleted =
    project && !project.print_binding_id ? "Encuadernación" : null;
  const sheetPaperNotCompleted =
    project && !project.print_sheet_paper_id ? "Tipo de papel" : null;

  // 2. Crear una lista de los campos que faltan.
  const missingFields = [
    qualityNotCompleted,
    sizeNotCompleted,
    orientationNotCompleted,
    aspectNotCompleted,
    bindingNotCompleted,
    sheetPaperNotCompleted,
  ].filter(Boolean) as string[];
  const missingFieldsMessage =
    missingFields.length > 0 ? missingFields.join(", ") : null;

  // 3. Definición del mensaje de estado (statusMessage)
  const statusMessage = project
    ? project.status === "exported"
      ? "Este proyecto ya ha sido comprado. Duplícalo para volver a comprar o modificar."
      : missingFieldsMessage // Verifica si faltan campos
        ? `Debes completar el proyecto antes de añadirlo a la cesta, falta por asignar: ${missingFieldsMessage}`
        : "Añade este proyecto a tu cesta para proceder a la compra."
    : "";

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
  const accessToken = useAuth((s) => s.accessToken);

  const [addingToCart, setAddingToCart] = useState(false);
  const {
    exportPdf,
    exporting,
    exportMode,
    error: exportError,
  } = useProjectPdfExport();
  const [pricePreview, setPricePreview] = useState<ProjectPricePreview | null>(
    null,
  );
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [ownershipModalOpen, setOwnershipModalOpen] = useState(false);
  const [ownershipModalDismissed, setOwnershipModalDismissed] = useState(false);
  const [duplicatingForeign, setDuplicatingForeign] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const router = useRouter();

  const canEditProject = useMemo(() => {
    if (!project || !currentUser) return false;
    if (project.owner_id === currentUser.id) return true;
    return Boolean(project.current_user_can_edit);
  }, [project, currentUser]);
  const canManageProject = useMemo(() => {
    if (!project || !currentUser) return false;
    if (project.owner_id === currentUser.id) return true;
    return Boolean(project.current_user_can_manage_sharing);
  }, [project, currentUser]);
  const isForeignOwner = useMemo(
    () => Boolean(project) && !canManageProject && !canEditProject,
    [project, canManageProject, canEditProject],
  );
  const isInteractionDisabled = isProjectExported || !canEditProject;

  /* --------- fetch proyecto --------- */
  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      const res = await fetch(
        `${API_BASE}/projects/${projectId}/?_=${Date.now()}`,
        {
          headers,
          credentials: "include",
          cache: "no-store",
        },
      );
      if (res.status === 404) throw new Error("Proyecto no encontrado (404)");
      if (!res.ok)
        throw new Error(
          `Error ${res.status}: ${(await res.text()) || "Fallo al cargar el proyecto"}`,
        );
      setProject(await res.json());
    } catch (e: any) {
      setError(e.message || "Error al cargar los detalles del proyecto.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, accessToken, projectId]);

  /* --------- fetch clips --------- */
  const fetchClips = useCallback(async () => {
    if (!projectId) return;
    try {
      const headers: HeadersInit = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      const res = await fetch(`${API_BASE}/projects/${projectId}/clips/`, {
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Clips ${res.status}`);
      const data: ProjectClipPayload[] = await res.json();
      data.sort((a, b) => (a.position ?? 1) - (b.position ?? 1));
      setClips(data);
    } catch (e) {
      // No tiramos la UI entera por error de clips; mostramos vacío y permitimos reintentar con acciones
      console.error(e);
    }
  }, [API_BASE, accessToken, projectId]);

  /* --------- montar --------- */

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  const fetchProjectPrice = useCallback(async () => {
    if (!accessToken || !project?.id) return;
    setPriceLoading(true);
    setPriceError(null);
    try {
      const res = await fetch(
        `${API_BASE}/projects/${project.id}/price-breakdown/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
        },
      );
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Error ${res.status}`);
      }
      const data = (await res.json()) as ProjectPricePreview;
      setPricePreview(data);
    } catch (err: any) {
      setPriceError(
        err?.message || "No se pudo calcular el precio del proyecto.",
      );
    } finally {
      setPriceLoading(false);
    }
  }, [API_BASE, accessToken, project?.id]);

  useEffect(() => {
    if (!project) {
      setPricePreview(null);
      return;
    }
    void fetchProjectPrice();
  }, [project, fetchProjectPrice]);

  useEffect(() => {
    if (isForeignOwner && !ownershipModalDismissed) {
      setOwnershipModalOpen(true);
    } else {
      setOwnershipModalOpen(false);
    }
  }, [isForeignOwner, ownershipModalDismissed]);

  const handleCloseOwnershipModal = useCallback(() => {
    setOwnershipModalDismissed(true);
    setOwnershipModalOpen(false);
  }, []);

  const handleDuplicateForForeignOwner = useCallback(async () => {
    if (!project) return;
    if (!accessToken) {
      toast.error("Debes iniciar sesión para duplicar el proyecto.");
      return;
    }
    setDuplicateError(null);
    setDuplicatingForeign(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/duplicate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(
          detail || `Error ${res.status} al duplicar el proyecto.`,
        );
      }
      const clone = await res.json();
      toast.success("Proyecto duplicado en tu cuenta.");
      setOwnershipModalOpen(false);
      setOwnershipModalDismissed(true);
      router.push(`/projects/${clone.id}`);
    } catch (err: any) {
      const message = err?.message || "No se pudo duplicar el proyecto.";
      setDuplicateError(message);
      toast.error(message);
    } finally {
      setDuplicatingForeign(false);
    }
  }, [API_BASE, accessToken, project, router]);

  const handleThumbsDensityChange = useCallback(async () => {
    await fetchClips();
  }, [fetchClips]);

  const openEffectsModal = useCallback(() => setEffectsModalOpen(true), []);
  const closeEffectsModal = useCallback(() => setEffectsModalOpen(false), []);
  const handleEffectSaved = useCallback(() => {
    void fetchProject();
  }, [fetchProject]);
  const handleSaveTitle = useCallback(
    async (nextTitle: string) => {
      if (!accessToken) {
        throw new Error("Debes iniciar sesión para editar el título.");
      }
      const normalized = nextTitle.trim();
      const payload = normalized.length ? normalized : null;
      const res = await fetch(`${API_BASE}/projects/${projectId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ name: payload }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status} al actualizar el título.`);
      }
      const updated = await res.json();
      setProject(updated);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("videopapel:project:changed"));
      }
      toast.success("Título actualizado correctamente.");
    },
    [API_BASE, accessToken, projectId],
  );

  const effectsPreviewClip = useMemo<EffectPreviewClip | null>(() => {
    const cover = project?.cover_image;
    if (cover?.image_url) {
      const coverClip = clips.find((clip) => clip.id === cover.project_clip_id);
      return {
        videoUrl:
          cover.video_url ??
          coverClip?.video_url ??
          project?.primary_clip?.video_url ??
          null,
        frameTimeMs: cover.frame_time_ms,
        imageUrl: cover.image_url,
        image_url: cover.image_url,
        url: cover.image_url,
      };
    }
    return (
      resolveClipPreview(clips[0]) ??
      resolveClipPreview(project?.primary_clip ?? null)
    );
  }, [clips, project?.cover_image, project?.primary_clip]);

  const coverItems = useMemo<FramePickerItem[]>(() => {
    const out: FramePickerItem[] = [];
    for (const clip of clips) {
      const thumbs = Array.isArray(clip.thumbnails) ? clip.thumbnails : [];
      for (const thumb of thumbs) {
        out.push({
          id: `${clip.id}-${thumb.frame_time_ms}`,
          clipId: clip.id,
          clipPosition: clip.position ?? null,
          frameTimeMs: thumb.frame_time_ms,
          imageUrl: thumb.image_url ?? null,
          videoUrl: clip.video_url ?? null,
        });
      }
    }
    return out;
  }, [clips]);

  const filteredPriceBreakdown = useMemo<PriceBreakdown | null>(() => {
    const breakdown = pricePreview?.price_breakdown;
    if (!breakdown) return null;
    if (!breakdown.line_items.some((line) => isShippingLine(line)))
      return breakdown;

    const visibleLines = breakdown.line_items.filter(
      (line) => !isShippingLine(line),
    );

    const visibleTotal = visibleLines.reduce(
      (sum, line) => sum + parseMoney(line.amount),
      0,
    );

    return {
      ...breakdown,
      subtotal: formatMoney(visibleTotal),
      total: formatMoney(visibleTotal),
      line_items: visibleLines,
    };
  }, [pricePreview]);

  const displayLineTotal = useMemo(() => {
    if (filteredPriceBreakdown) return filteredPriceBreakdown.total;
    return pricePreview?.line_total ?? null;
  }, [filteredPriceBreakdown, pricePreview?.line_total]);

  /* --------- insertar video (crear clip) --------- */
  const handleSelectVideo = useCallback(
    async (video: VideoItem) => {
      if (!accessToken || isInteractionDisabled) {
        if (isInteractionDisabled)
          toast.error("Duplica el proyecto para poder editarlo.");
        return;
      }
      setActionError(null);
      setCreatingClip(true);
      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/clips/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({ video_id: video.id }),
        });
        if (!res.ok) {
          let detail = "";
          try {
            const payload = await res.json();
            detail = payload?.detail || payload?.error || "";
          } catch {
            detail = await res.text();
          }
          throw new Error(detail || `Error ${res.status} al crear el clip`);
        }
        // Refrescamos clips y cerramos modal
        await fetchClips();
        setPickerOpen(false);
      } catch (e: any) {
        setActionError(e.message || "No se pudo insertar el video.");
      } finally {
        setCreatingClip(false);
      }
    },
    [API_BASE, accessToken, projectId, fetchClips, isInteractionDisabled],
  );

  const handleSelectCover = useCallback(
    async (item: FramePickerItem) => {
      if (!accessToken || isInteractionDisabled) {
        if (isInteractionDisabled)
          toast.error("Duplica el proyecto para poder editarlo.");
        return;
      }
      setCoverError(null);
      setCoverBusy(true);
      try {
        const res = await fetch(
          `${API_BASE}/projects/${projectId}/cover-image/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
            body: JSON.stringify({
              project_clip_id: item.clipId,
              frame_time_ms: item.frameTimeMs,
              image_url: item.imageUrl,
            }),
          },
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Error ${res.status} al guardar la portada`);
        }
        const data = await res.json();
        setProject(data);
        setCoverPickerOpen(false);
        toast.success("Portada actualizada.");
      } catch (e: any) {
        setCoverError(e.message || "No se pudo guardar la portada.");
      } finally {
        setCoverBusy(false);
      }
    },
    [API_BASE, accessToken, isInteractionDisabled, projectId],
  );

  const handleAddToCart = useCallback(async () => {
    if (!project) return;
    if (!accessToken) {
      toast.error("Debes iniciar sesión para añadir al cesta.");
      return;
    }
    setAddingToCart(true);
    try {
      const res = await fetch(`${API_BASE}/cart/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify({ project_id: project.id, quantity: 1 }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Error ${res.status} al añadir al cesta`);
      }
      toast.success("Proyecto añadido al cesta.");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo añadir al cesta.");
    } finally {
      setAddingToCart(false);
    }
  }, [API_BASE, accessToken, project]);

  /* --------- Render: estados --------- */

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-xl font-semibold text-gray-700">
          Cargando proyecto...
        </p>
        <p className="text-sm text-gray-500">ID: {projectId}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-red-600">Error</h2>
        <p className="text-sm text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-xl font-semibold text-gray-700">
          Proyecto no disponible.
        </p>
      </div>
    );
  }

  /* --------- Render principal --------- */

  /* --------- Render principal --------- */

  /* --------- Render principal --------- */

  return (
    <div className="w-full h-full p-4 bg-gray-50">
      <header className="mb-6 border-b pb-4 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-800">
            {project.name || "Proyecto sin nombre"}
          </h1>
          <button
            type="button"
            aria-label="Editar título del proyecto"
            onClick={() => setEditTitleOpen(true)}
            disabled={isInteractionDisabled}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <SquarePen className="h-5 w-5" />
          </button>
        </div>
        <div className="flex w-full justify-center items-center gap-3 text-sm text-gray-500 sm:w-auto">
          <StatusBadge
            status={project.status}
            compact
            onAddToCart={handleAddToCart}
            addToCartDisabled={
              !project ||
              addingToCart ||
              exporting ||
              project.status === "exported" ||
              project.status === "draft"
            }
            addingToCart={addingToCart}
          />
          <DuplicateProjectButton
            projectId={project.id}
            size="large"
            title="Duplicar proyecto"
          />
          <ShareProjectButton onClick={() => setShareOpen(true)} />
        </div>
      </header>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow p-1">
          {/* <h2 className="text-xl font-semibold mb-3">Previsualización y Edición de Clips</h2> */}

          <div className="space-y-3 text-sm">
            {project.status === "exported" && (
              <p className="text-sm text-gray-500">{statusMessage}</p>
            )}

            {project.status !== "exported" && (
              <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:overflow-x-auto lg:pb-1">
                <SelectableBadgeWrapper
                  BadgeComponent={ProjectPrivacyBadge}
                  SelectorComponent={PrivacySelector}
                  badgeProps={{
                    isPublic: Boolean(project.is_public),
                    compact: true,
                    clickable: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.is_public ?? false,
                    onSaved: () => {
                      void fetchProject();
                      closeModal();
                    },
                  })}
                  modalTitle="Privacidad del proyecto"
                  modalDescription="Define si este proyecto es público o privado."
                  disabled={isProjectExported || !canManageProject}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintQualityBadge}
                  SelectorComponent={QualitySelector}
                  badgeProps={{
                    name: project.print_quality_name,
                    dpi:
                      project.print_quality_dpi ??
                      project.print_quality_ppi ??
                      null,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_quality_id ?? null,
                    onSaved: () => {
                      void fetchProject();
                      closeModal();
                    },
                  })}
                  modalTitle="Seleccionar calidad de impresión"
                  modalDescription="Elige la calidad con la que se generarán las impresiones."
                  disabled={isInteractionDisabled}
                />

                <SelectableBadgeWrapper
                  BadgeComponent={PrintSizeBadge}
                  SelectorComponent={SizeSelector}
                  badgeProps={{
                    name: project.print_size_label,
                    widthMm: project.print_size_width_mm,
                    heightMm: project.print_size_height_mm,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_size_id ?? null,
                    onSaved: () => {
                      void fetchProject();
                      closeModal();
                    },
                  })}
                  modalTitle="Selecciona tamaño de proyecto"
                  modalDescription="Escoge el tamaño que se aplicará al proyecto."
                  disabled={isInteractionDisabled}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintOrientationBadge}
                  SelectorComponent={OrientationSelector}
                  badgeProps={{
                    orientation: project.print_orientation_type ?? null,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_orientation_id ?? null,
                    onSaved: () => {
                      void fetchProject();
                      closeModal();
                    },
                  })}
                  modalTitle="Seleccionar orientación de impresión"
                  modalDescription="Elige la orientación que se aplicará al proyecto."
                  disabled={isInteractionDisabled}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintBindingBadge}
                  SelectorComponent={BindingSelector}
                  badgeProps={{
                    name: project.print_binding_name,
                    description: project.print_binding_description,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_binding_id ?? null,
                    onSaved: () => {
                      void fetchProject();
                      closeModal();
                    },
                  })}
                  modalTitle="Seleccionar encuadernación"
                  modalDescription="Escoge el tipo de encuadernación para este proyecto."
                  disabled={isInteractionDisabled}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintSheetPaperBadge}
                  SelectorComponent={PrintSheetPaperSelector}
                  badgeProps={{
                    label: project.print_sheet_paper_label,
                    weight: project.print_sheet_paper_weight,
                    finishing: project.print_sheet_paper_finishing,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_sheet_paper_id ?? null,
                    onSaved: () => {
                      void fetchProject();
                      closeModal();
                    },
                  })}
                  modalTitle="Seleccionar papel de impresión"
                  modalDescription="Elige la hoja de papel que se aplicará al proyecto."
                  disabled={isInteractionDisabled}
                />

                <button
                  type="button"
                  onClick={openEffectsModal}
                  className="inline-block rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  disabled={isInteractionDisabled}
                >
                  <PrintEffectBadge
                    name={project.print_effect_label}
                    compact={true}
                  />
                </button>

                <SelectableBadgeWrapper
                  BadgeComponent={PrintAspectBadge}
                  SelectorComponent={AspectSelector}
                  badgeProps={{
                    slug: project.print_aspect_slug ?? null,
                    name: project.print_aspect_name ?? null,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_aspect_id ?? null,
                    onSaved: () => {
                      void fetchProject();
                      closeModal();
                    },
                  })}
                  modalTitle="Seleccionar posición de impresión"
                  modalDescription="Define cómo se ajustará la imagen al área de impresión."
                  disabled={isInteractionDisabled}
                />
              </div>
            )}
          </div>
          <div className="bg-black rounded-lg mb-4 p-2 h-[clamp(560px,calc(100svh-9rem),850px)] overflow-hidden">
            {clips.length ? (
              <EditingCanvas
                // miniaturas por segundo. calcula fotogramas según duración
                thumbsPerSecond={project.thumbs_per_second ?? 10}
                // elegir cantidad fija de miniaturas
                // thumbnailsCount={Math.round(45 * 2) + 1} // mayor densidad fotograma
                // thumbnailsCount={Math.round(12 * 4) + 1}// menor densidad de fotograma
                projectId={project.id}
                clips={clips.map((c) => ({
                  clipId: c.id,
                  videoSrc: c.video_url,
                  durationMs:
                    (c.time_end_ms ?? c.duration_ms) - (c.time_start_ms ?? 0),
                  frames: c.frames ?? [],
                  thumbnails: c.thumbnails ?? [], // 👈 NUEVO: pasamos thumbnails al canvas
                  timeStartMs: c.time_start_ms ?? 0,
                  timeEndMs: c.time_end_ms ?? c.duration_ms,
                }))}
                apiBase={API_BASE}
                accessToken={accessToken}
                printAspectSlug={project.print_aspect_slug ?? "fill"}
                onThumbsDensityChange={handleThumbsDensityChange}
                printSizeLabel={project.print_size_label ?? null}
                frameSetting={project.frame_setting ?? null}
                pageEnumerationSetting={
                  project.page_enumeration_setting ?? null
                }
                printWidthMm={project.print_size_width_mm ?? null}
                printHeightMm={project.print_size_height_mm ?? null}
                printQualityDpi={
                  project.print_quality_dpi ?? project.print_quality_ppi ?? null
                }
                printEffectName={project.print_effect_label ?? null}
                coverFrame={
                  project.cover_image
                    ? {
                        projectClipId: project.cover_image.project_clip_id,
                        frameTimeMs: project.cover_image.frame_time_ms,
                      }
                    : null
                }
                onPageEnumerationChange={(setting) => {
                  setProject((current) => {
                    if (!current) return current;
                    return {
                      ...current,
                      page_enumeration_setting: setting,
                    };
                  });
                }}
                onFrameChange={() => void fetchProject()}
                playbackFps={2}
                onChange={() => {}}
                onInsertVideo={() => {
                  if (isInteractionDisabled) return;
                  setPickerOpen(true);
                }} // <<— ABRIR MODAL
                onOpenCover={() => {
                  if (isInteractionDisabled) return;
                  setCoverError(null);
                  setCoverPickerOpen(true);
                }}
                editingDisabled={isProjectExported}
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-white/50">
                Sin clips
                <button
                  className="ml-3 px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 text-white text-sm"
                  onClick={() => {
                    if (isInteractionDisabled) return;
                    setPickerOpen(true);
                  }}
                  disabled={isInteractionDisabled}
                >
                  Insertar video
                </button>
              </div>
            )}
          </div>
          {/* <div className="mt-4 border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Clips en el Proyecto</h3>
            <div className="bg-gray-100 p-3 rounded-md min-h-[100px]">
              {clips.length === 0 ? (
                "No hay clips"
              ) : (
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  {clips.map((c) => (
                    <li key={c.id}>
                      #{c.position} · {c.video_url?.split("/").pop()} (
                      {(c.time_end_ms ?? c.duration_ms) -
                        (c.time_start_ms ?? 0)}{" "}
                      ms
                      {typeof c.thumbnails?.length === "number"
                        ? ` · ${c.thumbnails.length} miniaturas`
                        : ""}
                      )
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div> */}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Contenedor de Configuración de impresión */}
          {/* {project.status !== "exported" && (
          <div className="bg-white rounded-xl shadow p-4 border">
            <h2 className="text-xl font-semibold mb-3">Configuración de impresión</h2>
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <SelectableBadgeWrapper
                  BadgeComponent={PrintQualityBadge}
                  SelectorComponent={QualitySelector}
                  badgeProps={{
                    name: project.print_quality_name,
                    dpi: project.print_quality_dpi ?? project.print_quality_ppi ?? null,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_quality_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar calidad de impresión"
                  modalDescription="Elige la calidad con la que se generarán las impresiones."
                  disabled={isInteractionDisabled}
                />

                <SelectableBadgeWrapper
                  BadgeComponent={PrintSizeBadge}
                  SelectorComponent={SizeSelector}
                  badgeProps={{
                    name: project.print_size_label,
                    widthMm: project.print_size_width_mm,
                    heightMm: project.print_size_height_mm,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_size_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Selecciona tamaño de proyecto"
                  modalDescription="Escoge el tamaño que se aplicará al proyecto."
                  disabled={isInteractionDisabled}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintOrientationBadge}
                  SelectorComponent={OrientationSelector}
                  badgeProps={{
                    orientation: project.print_orientation_type ?? null,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_orientation_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar orientación de impresión"
                  modalDescription="Elige la orientación que se aplicará al proyecto."
                  disabled={isInteractionDisabled}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintBindingBadge}
                  SelectorComponent={BindingSelector}
                  badgeProps={{
                    name: project.print_binding_name,
                    description: project.print_binding_description,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_binding_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar encuadernación"
                  modalDescription="Escoge el tipo de encuadernación para este proyecto."
                  disabled={isInteractionDisabled}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={PrintSheetPaperBadge}
                  SelectorComponent={PrintSheetPaperSelector}
                  badgeProps={{
                    label: project.print_sheet_paper_label,
                    weight: project.print_sheet_paper_weight,
                    finishing: project.print_sheet_paper_finishing,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_sheet_paper_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar papel de impresión"
                  modalDescription="Elige la hoja de papel que se aplicará al proyecto."
                  disabled={isInteractionDisabled}
                />
                <button
                  type="button"
                  onClick={openEffectsModal}
                  className="inline-block rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  disabled={isInteractionDisabled}
                >
                  <PrintEffectBadge
                    name={project.print_effect_label}
                    compact={true}
                  />
                </button>
                <SelectableBadgeWrapper
                  BadgeComponent={PrintAspectBadge}
                  SelectorComponent={AspectSelector}
                  badgeProps={{
                    slug: project.print_aspect_slug ?? null,
                    name: project.print_aspect_name ?? null,
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.print_aspect_id ?? null,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Seleccionar proporción de impresión"
                  modalDescription="Define cómo se ajustará la imagen al área de impresión."
                  disabled={isInteractionDisabled}
                />
                <SelectableBadgeWrapper
                  BadgeComponent={ProjectPrivacyBadge}
                  SelectorComponent={PrivacySelector}
                  badgeProps={{
                    isPublic: Boolean(project.is_public),
                    compact: true,
                  }}
                  selectorProps={({ closeModal }) => ({
                    apiBase: API_BASE,
                    accessToken,
                    projectId: project.id,
                    value: project.is_public ?? false,
                    onSaved: () => {
                      void fetchProject()
                      closeModal()
                    },
                  })}
                  modalTitle="Privacidad del proyecto"
                  modalDescription="Define si este proyecto es público o privado."
                  disabled={isProjectExported || !canManageProject}
                />
              </div>

            </div>
          </div>
          )} */}

          <div className="bg-white rounded-xl shadow p-4 border space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Acciones rápidas
            </h2>
            <p className="text-sm text-gray-500">{statusMessage}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={
                  !project ||
                  addingToCart ||
                  exporting ||
                  project.status === "exported" ||
                  project.status === "draft"
                }
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {addingToCart ? "Añadiendo…" : "Añadir a la cesta"}
              </button>
              {project.status === "exported" && (
                <DuplicateProjectButton
                  projectId={project.id}
                  size="large"
                  title="Duplicar proyecto"
                />
              )}
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Ver cesta
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Desglose del proyecto
              </h2>
              <button
                type="button"
                onClick={() => void fetchProjectPrice()}
                disabled={priceLoading || !project}
                className="text-sm font-medium text-purple-600 hover:text-purple-500 disabled:opacity-40"
              >
                Actualizar
              </button>
            </div>
            {priceLoading ? (
              <p className="text-sm text-gray-500">Calculando precio…</p>
            ) : priceError ? (
              <p className="text-sm text-red-600">{priceError}</p>
            ) : pricePreview ? (
              <ProjectPriceCard
                projectId={pricePreview.project_id}
                projectName={
                  pricePreview.project_name || project?.name || "Proyecto"
                }
                quantity={pricePreview.quantity}
                totalPages={pricePreview.total_pages}
                unitPrice={pricePreview.unit_price}
                lineTotal={displayLineTotal}
                printSizeLabel={
                  pricePreview.print_size_label ??
                  project?.print_size_label ??
                  undefined
                }
                breakdown={filteredPriceBreakdown}
                className="bg-white"
              />
            ) : (
              <p className="text-sm text-gray-500">
                Completa la configuración del proyecto para ver el precio
                estimado.
              </p>
            )}
          </div>

          {/* Contenedor de Exportar y Comprar */}
          <div className="bg-green-50 border border-green-200 rounded-xl shadow-md p-4">
            <h2 className="text-xl font-semibold mb-3 text-green-800">
              Exportación
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-60"
                onClick={() => {
                  if (project) {
                    void exportPdf(project.id);
                  }
                }}
                disabled={exporting}
              >
                {exporting && exportMode === "standard"
                  ? "Generando PDF…"
                  : "Generar PDF"}
              </button>
              <button
                className="w-full py-3 bg-white text-green-700 border border-green-300 rounded-lg font-bold hover:bg-green-100 transition disabled:opacity-60"
                onClick={() => {
                  if (project) {
                    void exportPdf(project.id, { cleanOutput: true });
                  }
                }}
                disabled={exporting}
              >
                {exporting && exportMode === "clean"
                  ? "Generando PDF limpio…"
                  : `Generar PDF${project?.print_size_label ? ` ${project.print_size_label}` : ""} individual`}
              </button>
              <button
                className="w-full py-3 bg-emerald-900 text-white rounded-lg font-bold hover:bg-emerald-950 transition disabled:opacity-60"
                onClick={() => setAdvancedPdfModalOpen(true)}
                disabled={exporting}
              >
                Exportación avanzada
              </button>
            </div>
            {exportError && (
              <p className="text-xs text-red-600 mt-2">{exportError}</p>
            )}
            <p className="text-xs text-green-700 mt-2">
              Se utilizarán los clips y configuraciones actuales.
            </p>
          </div>
        </div>
      </div>

      {project && (
        <EffectsTile
          open={effectsModalOpen}
          apiBase={API_BASE}
          accessToken={accessToken}
          projectId={project.id}
          value={project.print_effect_id ?? null}
          onClose={closeEffectsModal}
          onSaved={handleEffectSaved}
          previewClip={effectsPreviewClip}
        />
      )}

      <Modal
        open={ownershipModalOpen}
        onClose={handleCloseOwnershipModal}
        title="Solo tienes permiso de visualización en este proyecto"
        description="Duplícalo para tener una copia propia y poder editarlo a tu gusto."
        footer={
          <>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
              onClick={handleCloseOwnershipModal}
              disabled={duplicatingForeign}
            >
              Ver proyecto
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-sm disabled:opacity-60"
              onClick={() => void handleDuplicateForForeignOwner()}
              disabled={duplicatingForeign}
            >
              {duplicatingForeign ? "Duplicando…" : "Duplicar proyecto"}
            </button>
          </>
        }
      >
        {/* <div className="space-y-2 text-sm text-gray-700">
          <p>Este proyecto es público, pero pertenece a otra cuenta. Crea una copia para guardarlo en tu espacio.</p>
          {duplicateError && <p className="text-red-600">{duplicateError}</p>}
        </div> */}
        {/* <p className="text-sm text-gray-700">
          Duplícalo para tener una copia propia y poder editarlo a tu gusto
        </p> */}
      </Modal>

      {/* Modal de selección de video */}
      <VideoPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        onSelect={handleSelectVideo}
        busy={creatingClip}
        error={actionError || undefined}
      />
      <FramePickerModal
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        items={coverItems}
        busy={coverBusy}
        error={coverError || undefined}
        onSelect={handleSelectCover}
      />
      <EditTitleModal
        open={editTitleOpen}
        currentTitle={project.name}
        onClose={() => setEditTitleOpen(false)}
        onSave={handleSaveTitle}
      />
      <PrintStylePresetPdfModal
        open={advancedPdfModalOpen}
        onClose={() => setAdvancedPdfModalOpen(false)}
        apiBase={API_BASE}
        accessToken={accessToken}
        projectPrintSizeLabel={project?.print_size_label ?? null}
        generating={exporting && exportMode === "standard"}
        onConfirm={async (presetId) => {
          if (!project) return;
          await exportPdf(project.id, { printStylePresetId: presetId });
          setAdvancedPdfModalOpen(false);
        }}
      />
      <ShareModal
        item={shareOpen ? project : null}
        resourceType="project"
        onClose={() => setShareOpen(false)}
        onItemUpdated={(updatedProject) => {
          setProject((current) =>
            current ? { ...current, ...updatedProject } : current,
          );
        }}
      />
    </div>
  );
}
