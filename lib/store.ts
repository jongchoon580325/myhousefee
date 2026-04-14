import { create } from "zustand";

export interface ManagementRecord {
  item: string;
  amount: number | null;
  prev: number | null;
  diff: number | null;
}

export interface RawSheet {
  items: ManagementRecord[];
  updatedAt: number;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  apartmentName?: string;
}

export type ViewType = "dashboard" | "charts" | "table" | "upload" | "rawSheet" | "settings";

interface StoreState {
  // Data
  records: ManagementRecord[];
  rawSheets: { [key: string]: RawSheet };

  // UI State
  activeView: ViewType;
  selectedYear: number;
  selectedMonth: number;
  selectedRawSheetMonth: string | null; // "YYYY-MM" format for rawSheet view
  searchQuery: string;
  isLoading: boolean;
  isOnline: boolean;

  // User
  user: User | null;

  // Actions
  setRecords: (records: ManagementRecord[]) => void;
  upsertRecord: (key: string, record: ManagementRecord) => void;
  deleteRecord: (key: string) => void;

  setRawSheet: (yearMonth: string, sheet: RawSheet) => void;
  deleteRawSheet: (yearMonth: string) => void;

  setActiveView: (view: ViewType) => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedRawSheetMonth: (yearMonth: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsLoading: (loading: boolean) => void;
  setIsOnline: (online: boolean) => void;
  setUser: (user: User | null) => void;

  resetAll: () => void;

  // Derived selectors
  getMonthSummaries: (year: number) => { [key: number]: { total: number; count: number } };
  getMonthRecords: (year: number, month: number) => ManagementRecord[];
  getYears: () => number[];
}

const initialState = {
  records: [],
  rawSheets: {},
  activeView: "dashboard" as ViewType,
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  selectedRawSheetMonth: null as string | null,
  searchQuery: "",
  isLoading: false,
  isOnline: true,
  user: null,
};

export const useStore = create<StoreState>((set, get) => ({
  ...initialState,

  setRecords: (records) => set({ records }),

  upsertRecord: (key, record) => {
    const state = get();
    const existingIndex = state.records.findIndex((r) => {
      const rKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${r.item}`;
      return rKey === key;
    });

    if (existingIndex >= 0) {
      const newRecords = [...state.records];
      newRecords[existingIndex] = record;
      set({ records: newRecords });
    } else {
      set({ records: [...state.records, record] });
    }
  },

  deleteRecord: (key) => {
    const state = get();
    set({
      records: state.records.filter((r) => {
        const rKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${r.item}`;
        return rKey !== key;
      }),
    });
  },

  setRawSheet: (yearMonth, sheet) => {
    const state = get();
    set({
      rawSheets: {
        ...state.rawSheets,
        [yearMonth]: sheet,
      },
    });
  },

  deleteRawSheet: (yearMonth) => {
    const state = get();
    const newSheets = { ...state.rawSheets };
    delete newSheets[yearMonth];
    set({ rawSheets: newSheets });
  },

  setActiveView: (view) => set({ activeView: view }),
  setSelectedYear: (year) => set({ selectedYear: year }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setSelectedRawSheetMonth: (yearMonth) => set({ selectedRawSheetMonth: yearMonth }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsOnline: (online) => set({ isOnline: online }),
  setUser: (user) => set({ user }),

  resetAll: () => set(initialState),

  getMonthSummaries: (year) => {
    const state = get();
    const summaries: { [key: number]: { total: number; count: number } } = {};

    Object.entries(state.rawSheets).forEach(([key, sheet]) => {
      const [sheetYear, sheetMonth] = key.split("-").map(Number);
      if (sheetYear === year) {
        const month = sheetMonth;
        if (!summaries[month]) {
          summaries[month] = { total: 0, count: 0 };
        }

        sheet.items.forEach((item) => {
          if (item.amount !== null) {
            summaries[month].total += item.amount;
            summaries[month].count += 1;
          }
        });
      }
    });

    return summaries;
  },

  getMonthRecords: (year, month) => {
    const state = get();
    const key = `${year}-${String(month).padStart(2, "0")}`;
    return state.rawSheets[key]?.items || [];
  },

  getYears: () => {
    const state = get();
    const years = new Set<number>();
    Object.keys(state.rawSheets).forEach((key) => {
      const year = parseInt(key.split("-")[0], 10);
      if (!isNaN(year)) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  },
}));
