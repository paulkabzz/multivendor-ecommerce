import { useStore } from "@/src/context/store-context";
import { Navigate, Outlet } from "react-router";
import Loader from "./loader/loader";

interface VendorRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
};

const VendorRoute: React.FC<VendorRouteProps> = ({ children, redirectPath=`/create-store/` }) => {
  const { hasStore, isLoading } = useStore();


  if (isLoading) return <div className="w-full h-[70vh] flex items-center justify-center"><Loader /></div>;

  if (!isLoading && !hasStore) {
     return <Navigate to={redirectPath} replace/>
  }

  return children ? <>{children}</> : <Outlet />;
}

export default VendorRoute;