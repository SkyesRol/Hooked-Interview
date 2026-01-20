import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const location = useLocation();

  if (!apiKey) {
    return <Navigate replace to="/settings" state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

