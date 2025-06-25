import ProfileContent from "@/src/components/profle/profile-content";

const Profile: React.FC = (): React.ReactElement => {
  return (
    <section className="w-full flex flex-col items-center pt-10">
      <div className="w-full flex justify-between">
        <div className="w-full">
          <ProfileContent />
        </div>
      </div>
    </section>
  );
};

export default Profile;
