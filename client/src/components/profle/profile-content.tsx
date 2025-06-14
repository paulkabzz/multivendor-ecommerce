import { Button } from "../common/buttons/button";
import { Input } from "../common/input/input";
import defaultProfilePic from '@assets/ui/default.png';

interface IProfileContentProps {
    active: number;
    user: any
};

const ProfileContent: React.FC<IProfileContentProps> = ({ active, user }) => {
  return (
    active === 1 && (
      <div className='flex flex-col items-center w-full min-h-[80vh]'>
        <div className="w-[250px] h-[250px] rounded-full bg-red relative">
          <img src={user?.profile_pic_url ?? defaultProfilePic} alt={`${user?.first_name}'s profile pic.`} className='w-full h-full object-cover' />
          <Button text='+' className='w-[30px] h-[30px] bg-[rgb(46,152,111)] text-primary-light rounded-full flex items-center justify-center absolute bottom-[10%] right-[10%] border-[#fff] border-[.15rem] border-solid cursor-pointer' />
        </div>
        <Input type='text' />
      </div>
    )
  )
}

export default ProfileContent;