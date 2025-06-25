import { useStore } from "@/src/context/store-context";
import { Navigate, Outlet } from "react-router";

interface VendorRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
};

const VendorRoute: React.FC<VendorRouteProps> = ({ children, redirectPath=`/create-store/` }) => {
  const { hasStore, isLoading } = useStore();

  if (!isLoading && !hasStore) {
     return <Navigate to={redirectPath} replace/>
  }

  return children ? <>{children}</> : <Outlet />;
}

export default VendorRoute;