import Loader from "@/src/components/common/loader/loader";
import StoreHeader from "@/src/components/store/store-header";
import { useStore } from "@src/context/store-context";

const MyStore = () => {
  const { store, isLoading } = useStore();
  if (isLoading) {
    return <div className="w-full h-[70vh] flex items-center justify-center"><Loader /></div>
  }
  return (

    <div>
      <StoreHeader store={store}/>
    </div>
  )
}

export default MyStore;