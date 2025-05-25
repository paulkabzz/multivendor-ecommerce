import { Input } from "@/src/components/common/input/input";
import logo from '@assets/logo-2.png';

const SignUp: React.FC = (): React.ReactElement => {
  return (
    <section className="w-full flex flex-col justify-center items-center pt-10">
      <div className="flex gap-1 items-center">
          <img src={logo} alt="logo" className="w-[80px] h-[80px]"/>
          <h1 className="font-[700] text-[2.5rem]">Sign Up</h1>
      </div>
        <div className="flex flex-col gap-7 mt-10">
              <div>
                  <label htmlFor="First Name" className="text-[12px] font-[600]">First Name</label>
                  <Input type="text" placeholder="John" className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
              </div>
              <div>
                  <label htmlFor="Last Name" className="text-[12px] font-[600]">Last Name</label>
                  <Input type="text" placeholder="Doe" className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
              </div>
              <div>
                  <label htmlFor="Email" className="text-[12px] font-[600]">Email</label>
                  <Input type="email" placeholder="johndoes@example.com" className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
              </div>
              <div>
                  <label htmlFor="Password" className="text-[12px] font-[600]">Password</label>
                  <Input type="password" className="!text-[#131313] !bg-[#ddd] !w-[350px]" />
              </div>
               <div>
                  <label htmlFor="Confirm Password" className="text-[12px] font-[600]">Confirm Password</label>
                  <Input type="password" className="!text-[#131313] !bg-[#ddd] !w-[350px]" />
              </div>
              
        </div>
    </section>
  )
}

export default SignUp;