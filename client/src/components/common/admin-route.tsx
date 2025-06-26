import { useAuth } from "@/src/context/auth-context";
import { Navigate, Outlet } from "react-router";
import Loader from "./loader/loader";

interface AdminRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ children, redirectPath="/not-admin" }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div className="w-full min-h-[70vh] flex items-center justify-center">
                <Loader />
            </div>
        )
    }
    
    if (!isLoading && user?.role !== "ADMIN" ) {
        return <Navigate to={redirectPath} replace />
    }

    return children ? <>{children}</>: <Outlet />;
}

export default AdminRoute;