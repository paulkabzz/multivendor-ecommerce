import { ShoppingCard } from "@/src/components/common/shopping-card/shopping-card";
import StoreHeader from "@/src/components/store/store-header";
import { BASE_URL } from "@/src/utils/url";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "react-router";
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

const Store: React.FC = (): React.ReactElement => {
    const { store_id } = useParams();
    const [store, setStore] = useState<Vendor | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const hasListings = store?.product.length && store.product.length >  0;

    useEffect(() => {
        const fetchStore = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${BASE_URL}/get-store?store_id=${store_id}`);

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Could not get store")
                }

                setStore(data.store);
                
                setIsLoading(false);
            } catch (error) {
                console.error(error);
            }
        }

        fetchStore();
    }, []);

    console.log(store)

    if (isLoading || !store)
        return <StoreSkeleton />

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
  )
}

export default Store;