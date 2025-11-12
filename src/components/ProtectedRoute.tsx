import { Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
