// src/components/MyProjects.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import { CircleX, ExternalLink, PartyPopper, Search, List, Layers2 } from "lucide-react";
import { ShareModal } from "@/components/ShareModal";
import { DateFormat } from "@/components/DateFormat";
import DuplicateProjectButton from "@/components/DuplicateProjectButton";
import ShareProjectButton from "@/components/ShareProjectButton";
import ProjectPrivacyBadge from "@/components/project/ProjectPrivacyBadge";
import StatusBadge from "@/components/project/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { acceptProjectInvitation } from "@/lib/projectInvitations";
import { toast } from "sonner";
import { ColorActionButton } from "@/components/ui/color-action-button";
import ViewOrderButton from "@/components/ViewOrderButton";


type Project = {
  id: string;
  name: string | null;
  status: "draft" | "ready" | "exported";
  created_at: string;
  updated_at: string;
  is_public: boolean;
  owner_email?: string | null;
  owner_name?: string | null;
  current_user_can_manage_sharing?: boolean;
  duplicate_of: string | null;
  duplicate_of_name?: string | null;
  membership_invited_by?: string | null;
  shared_with_emails?: string[];
  pending_invitation?: {
    token: string;
    email: string;
    role: "edit" | "view";
    role_label: string;
    expires_at?: string | null;
    is_expired: boolean;
  } | null;
  clip_count: number;
  print_size_label?: string | null;
  orientation_name?: string | null;
  effect_name?: string | null;
  event_id?: string | null;
  event_name?: string | null;
  order_id?: string | null;

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

type EventOption = {
  id: string;
  name: string;
  description?: string | null;
  project_count: number;
};

const monthYearFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});

type MyProjectsProps = {
  projects?: Project[] | null;
  emptyMessage?: string;
  searchPlaceholder?: string;
  fetchOnMount?: boolean;
  currentEventId?: string | null;
};

export default function MyProjects({
  projects: providedProjects,
  emptyMessage = "Aún no tienes proyectos.",
  searchPlaceholder = "Buscar por título, filtro, tamaño, usuario...",
  fetchOnMount = true,
  currentEventId = null,
}: MyProjectsProps) {
  const [projects, setProjects] = useState<Project[]>(providedProjects ?? []);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingInvitationToken, setAcceptingInvitationToken] = useState<string | null>(null);
  const [unlinkingProjectId, setUnlinkingProjectId] = useState<string | null>(null);
  const [eventPickerProject, setEventPickerProject] = useState<Project | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [linkingProjectId, setLinkingProjectId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [shareProject, setShareProject] = useState<Project | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
  const hasHydrated = useAuth((s) => s.hasHydrated);
  const accessToken = useAuth((s) => s.accessToken);
  const router = useRouter();

  const fetchProjects = useCallback(async () => {
    if (!fetchOnMount) {
      setLoading(false);
      return;
    }
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
    if (providedProjects) {
      setProjects(providedProjects);
      setLoading(false);
      setError(null);
    }
  }, [providedProjects]);

  useEffect(() => {
    if (!fetchOnMount) return;
    if (!hasHydrated || !accessToken) return;
    fetchProjects();
  }, [hasHydrated, accessToken, fetchOnMount, fetchProjects]);

  useEffect(() => {
    if (!fetchOnMount) return;
    const handler = () => fetchProjects();
    window.addEventListener("videopapel:project:changed", handler);
    return () => {
      window.removeEventListener("videopapel:project:changed", handler);
    };
  }, [fetchOnMount, fetchProjects]);

  const handleShareClick = useCallback((project: Project) => {
    setShareProject(project);
  }, []);

  const handleAcceptInvitation = useCallback(async (project: Project) => {
    const token = project.pending_invitation?.token;
    if (!token) return;

    setAcceptingInvitationToken(token);
    try {
      const payload = await acceptProjectInvitation(token);
      toast.success(payload.detail);
      await fetchProjects();
      router.push(`/projects/${payload.project_id}`);
    } catch (e: any) {
      toast.error(e?.message || "No se pudo aceptar la invitación.");
    } finally {
      setAcceptingInvitationToken(null);
    }
  }, [fetchProjects, router]);

  const handleUnlinkFromEvent = useCallback(async (project: Project) => {
    if (!accessToken || unlinkingProjectId === project.id) return;

    setUnlinkingProjectId(project.id);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/projects/${project.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ event_assignment_id: null }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }

      setProjects((prev) => prev.filter((item) => item.id !== project.id));
      toast.success("Proyecto desvinculado del evento.");
      window.dispatchEvent(new CustomEvent("videopapel:project:changed"));
    } catch (e: any) {
      setError(e.message || "No se pudo desvincular el proyecto del evento.");
      toast.error(e.message || "No se pudo desvincular el proyecto del evento.");
    } finally {
      setUnlinkingProjectId(null);
    }
  }, [API_BASE, accessToken, unlinkingProjectId]);

  const fetchEvents = useCallback(async () => {
    if (!accessToken) return;

    setLoadingEvents(true);
    try {
      const res = await fetch(`${API_BASE}/events/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setEvents(list);
      setSelectedEventId((current) =>
        current && list.some((event: EventOption) => event.id === current)
          ? current
          : list[0]?.id ?? null
      );
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar tus eventos.");
      toast.error(e.message || "No se pudieron cargar tus eventos.");
    } finally {
      setLoadingEvents(false);
    }
  }, [API_BASE, accessToken]);

  const openEventPicker = useCallback(async (project: Project) => {
    setEventPickerProject(project);
    setSelectedEventId(null);
    await fetchEvents();
  }, [fetchEvents]);

  const closeEventPicker = useCallback(() => {
    if (linkingProjectId) return;
    setEventPickerProject(null);
    setSelectedEventId(null);
  }, [linkingProjectId]);

  const handleLinkToEvent = useCallback(async () => {
    if (!accessToken || !eventPickerProject || !selectedEventId) return;

    setLinkingProjectId(eventPickerProject.id);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/projects/${eventPickerProject.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ event_assignment_id: selectedEventId }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }

      const updatedProject = await res.json();
      setProjects((prev) =>
        prev.map((project) =>
          project.id === updatedProject.id
            ? { ...project, ...updatedProject }
            : project
        )
      );
      setEventPickerProject(null);
      setSelectedEventId(null);
      toast.success("Proyecto vinculado al evento.");
      window.dispatchEvent(new CustomEvent("videopapel:project:changed"));
    } catch (e: any) {
      setError(e.message || "No se pudo vincular el proyecto al evento.");
      toast.error(e.message || "No se pudo vincular el proyecto al evento.");
    } finally {
      setLinkingProjectId(null);
    }
  }, [API_BASE, accessToken, eventPickerProject, selectedEventId]);

  if (!hasHydrated) return <p className="text-gray-500">Preparando…</p>;
  if (!accessToken)
    return (
      <p className="text-gray-500">Inicia sesión para ver tus proyectos.</p>
    );
  if (loading) return <p className="text-gray-500">Cargando…</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!projects.length)
    return <p className="text-gray-500">{emptyMessage}</p>;

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredProjects = projects.filter((project) => {
    if (!normalizedSearchTerm) return true;

    const searchableValues = [
      project.name,
      project.status,
      project.id,
      project.owner_email,
      project.owner_name,
      project.duplicate_of_name,
      project.membership_invited_by,
      project.print_size_label,
      project.orientation_name,
      project.effect_name,
      project.pending_invitation?.email,
      project.pending_invitation?.role_label,
      project.shared_with_emails?.join(" "),
      project.is_public ? "publico" : "privado",
      project.is_public ? "público" : "privado",
    ];

    return searchableValues.some((value) =>
      value?.toString().toLowerCase().includes(normalizedSearchTerm)
    );
  });

  const projectsByMonth = filteredProjects.reduce<
    Array<{ label: string; items: Project[] }>
  >((groups, project) => {
    const formattedLabel = monthYearFormatter.format(new Date(project.created_at));
    const label =
      formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.label === label) {
      lastGroup.items.push(project);
      return groups;
    }

    groups.push({ label, items: [project] });
    return groups;
  }, []);

  return (
    <>
      <section className="w-full">
        <div className="mb-6 max-w-xl">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black-900 transition hover:text-gray-600"
              >
                <CircleX className="h-4 w-4" />
              </button>
            )}
          </label>
        </div>

        {!filteredProjects.length ? (
          <p className="text-gray-500">
            No hay proyectos que coincidan con la búsqueda.
          </p>
        ) : (
        <div className="space-y-10">
          {projectsByMonth.map((group) => (
            <section key={group.label} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {group.label}
              </h2>

              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((p) => (
                  <li
                    key={`${p.id}-${p.pending_invitation?.token ?? "project"}`}
                    className="overflow-hidden rounded-xl border bg-white shadow-sm"
                  >
                    {(() => {
                      const hasPendingInvitation = Boolean(p.pending_invitation);
                      const isInsideCurrentEvent = Boolean(
                        currentEventId && p.event_id && p.event_id === currentEventId
                      );
                      const canLinkToEvent = !currentEventId && !p.event_id;
                      return (
                        <>
                          {p.primary_clip && p.primary_clip.video_url && (
                            <Link
                              href={`/projects/${p.id}`}
                              aria-label={`Abrir proyecto ${p.name || p.id}`}
                              className="block bg-gray-100 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                            >
                              <div className="grid aspect-video grid-cols-2 gap-0.5 overflow-hidden">
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
                            </Link>
                          )}

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="truncate text-base font-semibold">
                                {p.name || `Proyecto #${p.id}`}
                              </h3>
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <ProjectPrivacyBadge isPublic={p.is_public} compact />
                                <StatusBadge status={p.status} compact />
                                {hasPendingInvitation && (
                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                                    Invitación pendiente
                                  </span>
                                )}
                              </div>
{p.status === "exported" ? (
  <ViewOrderButton orderId={p.order_id} size="mini" />
) : null}
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
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
                              <div className="mt-1 space-y-1">
                                <ColorActionButton
                                  asChild
                                  color="amber"
                                  size="mini"
                                  icon={Layers2}
                                  bordered={false}
                                  shadowed={false}
                                  forceDisabled={false}
      
                                >
                                  <Link href={`/projects/${p.duplicate_of}`}>
                                    Proyecto duplicado de{" "}
                                    {p.duplicate_of_name || p.duplicate_of}
                                  </Link>
                                </ColorActionButton>
                                {p.membership_invited_by && (
                                  <p className="text-xs text-gray-400">
                                    Creado por: {p.membership_invited_by}
                                  </p>
                                )}
                              </div>
                            )}

                            {p.event_id && p.event_name && !isInsideCurrentEvent && (
                              <div className="mt-2">
                                <ColorActionButton
                                  asChild
                                  color="emerald"
                                  size="mini"
                                  icon={PartyPopper}
                                  bordered={false}
                                  shadowed={false}
                                >
                                  <Link href={`/events/${p.event_id}`}>
                                    Vinculado al evento {p.event_name}
                                  </Link>
                                </ColorActionButton>
                              </div>
                            )}

                            {isInsideCurrentEvent && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => void handleUnlinkFromEvent(p)}
                                  disabled={unlinkingProjectId === p.id}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <PartyPopper className="h-3.5 w-3.5" />
                                  {unlinkingProjectId === p.id
                                    ? "Desvinculando..."
                                    : "Desvincular de este evento"}
                                </button>
                              </div>
                            )}

                            {Array.isArray(p.shared_with_emails) &&
                              p.shared_with_emails.length > 0 && (
                                <div className="mt-1 space-y-1">
                                  {p.owner_email && (
                                    <p className="text-xs text-gray-400">
                                      Propietario: {p.owner_email}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400">
                                    Compartido con: {p.shared_with_emails.join(", ")}
                                  </p>
                                </div>
                              )}

                            <div className="mt-4 flex gap-2">
                              {hasPendingInvitation ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => void handleAcceptInvitation(p)}
                                    disabled={Boolean(p.pending_invitation?.is_expired) || acceptingInvitationToken === p.pending_invitation?.token}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                                  >
                                    {acceptingInvitationToken === p.pending_invitation?.token ? "Aceptando..." : "Aceptar invitación"}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <ColorActionButton
                                    asChild
                                    color="amber"
                                    filled
                                    size="mini"
                                    icon={ExternalLink}
                                  >
                                    <Link href={`/projects/${p.id}`}>
                                      Abrir proyecto
                                    </Link>
                                  </ColorActionButton>

                                  <DuplicateProjectButton
                                    projectId={p.id}
                                    size="mini"
                                    onDuplicated={(clone) => {
                                      setProjects((prev) => [clone as Project, ...prev]);
                                    }}
                                    onError={setError}
                                    title="Duplicar proyecto"
                                  />

                                  <ShareProjectButton
                                    onClick={() => handleShareClick(p)}
                                    size="mini"
                                  />
                                </>
                              )}
                            </div>

                            {!hasPendingInvitation && (
                          <div className="mt-4 flex items-center gap-2">
                                {canLinkToEvent && (
                                  <ColorActionButton
                                    type="button"
                                    onClick={() => void openEventPicker(p)}
                                    disabled={linkingProjectId === p.id}
                                    color="emerald"
                                    filled
                                    size="mini"
                                    icon={PartyPopper}
                                  >
                                    {linkingProjectId === p.id ? "Vinculando..." : "Vincular a evento"}
                                  </ColorActionButton>
                                )}

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

                            )}
                          </div>
                        </>
                      );
                    })()}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        )}
      </section>

      <ShareModal
        item={shareProject}
        resourceType="project"
        onClose={() => setShareProject(null)}
        onItemUpdated={(updatedProject) => {
          setProjects((prev) =>
            prev.map((projectItem) =>
              projectItem.id === updatedProject.id
                ? { ...projectItem, ...updatedProject }
                : projectItem
            )
          );
          setShareProject((current) =>
            current && current.id === updatedProject.id
              ? { ...current, ...updatedProject }
              : current
          );
        }}
      />

      <Modal
        open={Boolean(eventPickerProject)}
        onClose={closeEventPicker}
        title="Vincular a evento"
        description={
          eventPickerProject
            ? `Selecciona uno de tus eventos para vincular “${eventPickerProject.name || "este proyecto"}”.`
            : undefined
        }
        labelledById="link-project-event-title"
        describedById="link-project-event-description"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={closeEventPicker}
              disabled={Boolean(linkingProjectId)}
              className="rounded-xl border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleLinkToEvent()}
              disabled={!selectedEventId || Boolean(linkingProjectId) || loadingEvents}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {linkingProjectId ? "Vinculando..." : "Vincular"}
            </button>
          </>
        }
      >
        <div id="link-project-event-description" className="space-y-3">
          {loadingEvents ? (
            <p className="text-sm text-gray-500">Cargando eventos…</p>
          ) : events.length ? (
            <div className="space-y-2">
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEventId(event.id)}
                  className={[
                    "w-full rounded-xl border px-4 py-3 text-left transition",
                    selectedEventId === event.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{event.name}</p>
                      {event.description ? (
                        <p className="mt-1 text-xs text-gray-500">{event.description}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-medium text-emerald-700">
                      {event.project_count} {event.project_count === 1 ? "proyecto" : "proyectos"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Todavía no tienes eventos creados para vincular este proyecto.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
