import type { FrameSettingClient } from "@/types/frame";
import type { PageEnumerationSettingClient } from "@/types/pageEnumeration";
import type { MyLogosLogo } from "@/components/profile/MyLogos";

export type ClipThumbnail = {
  image_url: string;
  base_image_url?: string | null;
  frame_time_ms: number;
  inserted_image?: {
    id: number;
    image_url: string;
    offset_x_pct: number;
    offset_y_pct: number;
    width_pct: number;
    height_pct: number;
  } | null;
};

export type ProjectClipPayload = {
  id: number;
  video_url: string;
  duration_ms: number;
  frames?: number[] | null;
  thumbnails?: ClipThumbnail[] | null;
  time_start_ms?: number | null;
  time_end_ms?: number | null;
  position?: number | null;
};

/**
 * Forma que devuelve `ProjectDetailSerializer` del backend, tanto en
 * `GET /projects/:id/` como en la respuesta de cada PATCH de ajustes de
 * impresión. Por eso los selectores pueden devolver el proyecto ya
 * actualizado y evitar un refetch.
 */
export type Project = {
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
  company_logo?: MyLogosLogo | null;
};

/**
 * Valida de forma laxa que una respuesta PATCH traiga un proyecto completo
 * antes de volcarlo en el estado. Si el backend cambiara y dejara de
 * devolverlo, quien llama puede recurrir a un refetch.
 */
export function isProjectPayload(value: unknown): value is Project {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { id?: unknown }).id === "string" &&
    "status" in value
  );
}
