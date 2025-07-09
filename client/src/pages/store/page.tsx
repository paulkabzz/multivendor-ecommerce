import { ShoppingCard } from "@/src/components/common/shopping-card/shopping-card";
import StoreHeader from "@/src/components/store/store-header";
import { BASE_URL } from "@/src/utils/url";
import { Suspense } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import noProductsIcon from '@assets/icons/no-products.png'
import StoreSkeleton from "@/src/components/common/skeletons/store-skeleton";

interface Product {
    product_id: string;
    name: string;
    image: Array<{image_url: string}>;
    price: string;
    is_available: string;
}

interface Vendor {
  vendor_id: string;
  avatar_url: string | null;
  store_name: string;
  last_active: string;
  bio: string | null;
  ig_username: string | null;
  product: Array<Product>
}

interface StoreResponse {
  store: Vendor;
}

const fetchStore = async (store_id: string): Promise<Vendor> => {
  const response = await fetch(`${BASE_URL}/get-store?store_id=${store_id}`);
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Could not get store");
  }
  
  const data: StoreResponse = await response.json();
  return data.store;
};

const Store: React.FC = (): React.ReactElement => {
    const { store_id } = useParams<{ store_id: string }>();
    
    const {
      data: store,
      isLoading,
      error,
      isError
    } = useQuery({
      queryKey: ['store', store_id],
      queryFn: () => fetchStore(store_id!),
      enabled: !!store_id,
      staleTime: 10 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    const hasListings = store?.product && store.product.length > 0;

    if (isError) {
      console.error('Store fetch error:', error);
      return (
        <div className="min-h-[50vh] w-full px-[200px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2">Failed to load store</p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Something went wrong'}
            </p>
          </div>
        </div>
      );
    }

    if (isLoading || !store) {
      return <StoreSkeleton />;
    }

    return (
      <div className="min-h-[50vh] w-full px-[200px]">
        <StoreHeader store={store} />
        {hasListings ? (
          <div className="grid grid-cols-4 gap-4 items-center mt-10">
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded" />}>
              {store.product.map((product) => (
                <ShoppingCard
                  key={product.product_id} 
                  name={product.name} 
                  price={Number(product.price)} 
                  images={product.image}
                  product_id={product.product_id}
                />
              ))}
            </Suspense>
          </div>
        ) : (
          <div className="w-full flex items-center mt-10 flex-col gap-3">
            <img 
              src={noProductsIcon} 
              alt="No products listed" 
              className="w-[250px] h-auto"
              loading="lazy"
              width="250"
              height="auto"
            />
            <p className="text-[#777] text-[12px]">
              This shop doesn't have any items for sale yet.
            </p>
          </div>
        )}
      </div>
    );
};

export default Store;