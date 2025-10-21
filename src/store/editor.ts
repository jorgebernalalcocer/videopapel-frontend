import { create } from 'zustand';

type Layer = { id: string; type: 'text' | 'image' | 'shape'; x: number; y: number; props: Record<string, any> };
type EditorState = {
  layers: Layer[];
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  layers: [],
  addLayer: (layer) => set((s) => ({ layers: [...s.layers, layer] })),
  updateLayer: (id, patch) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  removeLayer: (id) => set((s) => ({ layers: s.layers.filter((l) => l.id !== id) })),
}));
