import { Input } from "@/src/components/common/input/input";
import logo from '@assets/logo-2.png';

const SignUp: React.FC = (): React.ReactElement => {
  return (
    <section className="w-full flex flex-col justify-center items-center pt-10">
      <div className="flex gap-1 items-center">
          <img src={logo} alt="logo" className="w-[80px] h-[80px]"/>
          <h1 className="font-[700] text-[2.5rem]">Sign Up</h1>
      </div>
        <div className="flex flex-col gap-5 mt-10">
              <Input type="text" placeholder="First Name..." className="!text-[#131313] !bg-[#ddd] !w-[350px]" />
              <Input type="text" placeholder="Last Name..." className="!text-[#131313] !bg-[#ddd] !w-[350px]" />
              <Input type="email" placeholder="Email..." className="!text-[#131313] !bg-[#ddd] !w-[350px]" />

        </div>
    </section>
  )
}

export default SignUp;