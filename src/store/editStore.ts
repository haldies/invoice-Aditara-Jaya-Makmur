import { create } from "zustand";

export type FieldType = "text" | "textarea";

export interface EditFieldPayload {
  path: string; // e.g. "personalInfo.fullName", "summary", "experiences.exp1.company", "experiences.exp1.description.0"
  label: string;
  value: string;
  type: FieldType;
  itemId?: string; // For experiences, education, projects
  subField?: string; // For item field (e.g. "company", "degree")
  descIndex?: number; // For experience bullet points
}

interface EditStore {
  activeField: EditFieldPayload | null;
  openEditor: (payload: EditFieldPayload) => void;
  closeEditor: () => void;
}

export const useEditStore = create<EditStore>((set) => ({
  activeField: null,
  openEditor: (payload) => set({ activeField: payload }),
  closeEditor: () => set({ activeField: null }),
}));
