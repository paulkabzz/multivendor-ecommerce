import { useAppSelector } from '@/src/store/hooks';
import ProfileContent from '@/src/components/profle/profile-content';
import { ProfileSideBar } from '@/src/components/profle/profile-sidebar';
import { useState } from 'react';

const Profile: React.FC = (): React.ReactElement => {
  const { user } = useAppSelector(state => state.user);

  const [active, setActive] = useState<number>(1);

  return (
    <section className="w-full flex flex-col items-center pt-10">
      <div className='w-full flex justify-between'>
          <div className='w-[350px]'>
              <ProfileSideBar active={active} setActive={setActive} />
          </div>
          <div className='w-full'>
              <ProfileContent active={active} user={user}/>
          </div>
      </div>
    </section>
  );
};

export default Profile;