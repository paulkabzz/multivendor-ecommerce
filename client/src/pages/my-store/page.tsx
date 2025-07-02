import { memo, useMemo, lazy, Suspense } from 'react';
import Loader from "@/src/components/common/loader/loader";
import StoreHeader from "@/src/components/store/store-header";
import { useStore } from "@src/context/store-context";
import noProductsIcon from '@assets/icons/no-products.png'
import { Button } from "@/src/components/common/buttons/button";
import { useNavigate } from "react-router";

const ShoppingCard = lazy(() => 
  import("@/src/components/common/shopping-card/shopping-card").then(module => ({
    default: module.ShoppingCard
  }))
);

const MyStore = memo(() => {
  const { store, isLoading } = useStore();
  const navigate = useNavigate();

  const hasListings = useMemo(() => (store?.product?.length ?? 0) > 0, [store?.product?.length]);
  
  const products = useMemo(() => store?.product || [], [store?.product]);

  if (isLoading) {
    return (
      <div className="w-full h-screen fixed top-0 left-0 z-[100000] bg-white flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] w-full px-[200px]">
      <StoreHeader store={store} />
      
      {hasListings ? (
        <div className="grid grid-cols-4 gap-4 items-center mt-10">
          <Button 
            text="+ Add Item" 
            className="p-5 !text-[12px] mt-2" 
            action={() => navigate('/create-item')} 
          />
          
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded" />}>
            {products.map((product) => (
              <ShoppingCard 
                key={product.product_id} 
                name={product.name} 
                price={product.price} 
                images={product.image} 
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
          <Button 
            text="+ Add Item" 
            className="p-5 !text-[12px] mt-2" 
            action={() => navigate('/create-item')} 
          />
        </div>
      )}
    </div>
  );
});

MyStore.displayName = 'MyStore';

export default MyStore;