
import defalutStore from '@assets/ui/default-store.png';
interface StoreHeader {
    store: any;
}

const StoreHeader:React.FC<StoreHeader> = ({ store }) => {
  return (
    <div className="w-full flex flex-col">
        <img src={store.avatar_url ?? defalutStore} alt={store.store_name} className='w-[250px] h-[250px] rounded-full'/>
    </div>
  )
}

export default StoreHeader;