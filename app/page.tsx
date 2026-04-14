"use client";

import { useStore } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";
import {
  DashboardView,
  ChartsView,
  TableView,
  UploadView,
  RawSheetView,
} from "@/components/views";
import { SettingsView } from "@/components/views/SettingsView";

export default function Home() {
  const activeView = useStore((state) => state.activeView);

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "charts":
        return <ChartsView />;
      case "table":
        return <TableView />;
      case "upload":
        return <UploadView />;
      case "rawSheet":
        return <RawSheetView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return <AppShell>{renderView()}</AppShell>;
}
