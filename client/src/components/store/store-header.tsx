
import { formatTimeAgo } from '@/src/utils/helpers';
import defalutStore from '@assets/ui/default-store.png';
import onlineSymbol from '@assets/icons/online.png';
import instagramIcon from '@assets/icons/instagram.png'
import { Link } from 'react-router';
interface StoreHeader {
    store: any;
}

const StoreHeader:React.FC<StoreHeader> = ({ store }) => {
  return (
    <div className="w-full flex flex-col items-center mt-10">
        <div className='flex items-center gap-10'>
            <div className='w-[200px] h-[200px] rounded-full overflow-hidden'>
                <img src={store.avatar_url ?? defalutStore} alt={store.store_name} className='w-full h-full object-cover object-top aspect-square'/>
            </div>
            <div className='flex flex-col items-start h-full'>

                    <h3 className='font-bold text-[1.25rem] mb-2'>
                        { store.store_name }
                    </h3>
                    <div className='flex gap-5 mb-2'>
                        <p className='text-[14px] text-[#777] cursor-pointer'>
                            0 likes
                        </p>
                        <p className='text-[14px] text-[#777]'>
                            0 sold
                        </p>
                    </div>
                    <p className='text-[14px] text-[#777] flex gap-1'>
                        <img src={onlineSymbol} alt="Online" className='w-[20px] h-[20px]' />
                        Active{" "}{formatTimeAgo(store.last_active)}
                    </p>
                    {
                        store.ig_username && (
                            <Link to={`https://www.instagram.com/${store.ig_username}`} className='flex gap-2 items-center mt-2' target='_blank'>
                                <img src={instagramIcon} alt={store.ig_username} className='w-[16px] h-[16px]' />
                                <p className='text-[14px] text-link'>
                                    @{ store.ig_username }
                                </p>
                            </Link>
                        )
                    }
            </div>  
        </div>
        <div className='mt-5'>
            <p className='text-[14px]'>
                { store.bio }
            </p>
        </div>
    </div>
  )
}

export default StoreHeader;