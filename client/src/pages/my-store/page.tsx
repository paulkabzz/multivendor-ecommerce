import Loader from "@/src/components/common/loader/loader";
import StoreHeader from "@/src/components/store/store-header";
import { useStore } from "@src/context/store-context";
import noProductsIcon from '@assets/icons/no-products.png'
import { Button } from "@/src/components/common/buttons/button";
import { useNavigate } from "react-router";
import { ShoppingCard } from "@/src/components/common/shopping-card/shopping-card";

const MyStore = () => {
  const { store, isLoading } = useStore();

  console.log(store)
  if (isLoading) {
    return <div className="w-full h-[70vh] flex items-center justify-center"><Loader /></div>
  }
  const navigate = useNavigate();

  const hadListings = store?.product.length > 0;

  
  return (

    <div className="min-h-[50vh] w-full">
      <StoreHeader store={store}/>
      {
        hadListings ? (
          <div className="flex gap-5">
              {
                store?.product.map((p: any) =>(
                   <ShoppingCard key={p.product_id} name={p.name} price={p.price} img_url={p.image[0].image_url} />
                ))
              }
          </div>
        ) : (
          <>
            <div className="w-full flex items-center mt-10 flex-col gap-3">
                <img src={noProductsIcon} alt="No products listed" className="w-[250px] h-auto"  />
                <p className="text-[#777] text-[12px]">
                    This shop doesn't have any items for sale yet.
                </p>
                <Button text="+ Add Item" className="p-5 !text-[12px] mt-2" action={() => navigate('/create-item')} />
            </div>
          </>
        )
      }
    </div>
  )
}

export default MyStore;