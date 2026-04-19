import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LabelData } from '../lib/pdfGenerator';

interface LabelState {
  pages: LabelData[];
  searchQuery: string;
  addPage: () => void;
  removePage: (index: number) => void;
  updatePage: (index: number, page: LabelData) => void;
  setSearchQuery: (query: string) => void;
  clearAll: () => void;
}

const DEFAULT_PAGE: LabelData = {
  name: '',
  size: '',
  brand: '',
  category: '',
  locationId: '',
};

export const useLabelStore = create<LabelState>()(
  persist(
    (set) => ({
      pages: [{ ...DEFAULT_PAGE }],
      searchQuery: '',
      addPage: () =>
        set((state) => ({
          pages: [...state.pages, { ...DEFAULT_PAGE }],
        })),
      removePage: (index: number) =>
        set((state) => ({
          pages: state.pages.filter((_, idx) => idx !== index),
        })),
      updatePage: (index: number, page: LabelData) =>
        set((state) => {
          const newPages = [...state.pages];
          newPages[index] = page;
          return { pages: newPages };
        }),
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      clearAll: () => set({ pages: [{ ...DEFAULT_PAGE }], searchQuery: '' }),
    }),
    {
      name: 'label-store',
    },
  ),
);
