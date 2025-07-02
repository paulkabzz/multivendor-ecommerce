import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/src/context/auth-context";
import Loader from "./loader/loader";
import { useStore } from "@/src/context/store-context";

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = `/login?callbackUrl=${encodeURIComponent(location.pathname + location.search)}`,
  children,
}) => {
  const { isAuthenticated, isLoading } =  useAuth();
  const { isLoading: l} = useStore();

  if (isLoading || l) return <div className="w-full bg-white min-h-[100vh] fixed top-0 right-0 z-[10000] flex items-center justify-center"><Loader /></div>

  if (!isLoading && !isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
