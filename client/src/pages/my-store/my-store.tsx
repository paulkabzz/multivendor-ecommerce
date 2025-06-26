import StoreHeader from "@/src/components/store/store-header";
import { useStore } from "@src/context/store-context";

const MyStore = () => {
  const { store } = useStore();
  return (
    <div>
      <StoreHeader store={store}/>
    </div>
  )
}

export default MyStore;