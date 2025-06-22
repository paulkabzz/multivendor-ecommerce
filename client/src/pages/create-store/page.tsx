import { Button } from '@/src/components/common/buttons/button';
import { Input } from '@/src/components/common/input/input';
import logo from '@assets/logo.png';
import { Link } from 'react-router-dom';
const CreateStore: React.FC = () => {
    const user: any = {};
  return (
      <section className="w-full flex flex-col justify-center items-center pt-10">
      <div className="flex gap-1 items-center">
        <img src={logo} alt="logo" className="w-[80px] h-[80px]" />
        <h1 className="font-[700] text-[2.5rem]">Sign Up</h1>
      </div>
      <form className="flex flex-col gap-7 mt-10" onSubmit={() => undefined}>
        <div>
          <label htmlFor="first_name" className="text-[12px] font-[600]">
            Store Name
          </label>
          <Input
            type="text"
            value={user.first_name}
            name="first_name"
            action={() => undefined}
            placeholder="John"
            className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]"
          />
        </div>
        <div>
          <label htmlFor="Last Name" className="text-[12px] font-[600]">
            Last Name
          </label>
          <Input
            type="text"
            value={user.last_name}
            name="last_name"
            placeholder="Doe"
            action={() => undefined}
            className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]"
          />
        </div>
        <div>
          <label htmlFor="Email" className="text-[12px] font-[600]">
            Email
          </label>
          <Input
            type="email"
            value={user.email}
            name="email"
            placeholder="johndoes@example.com"
            action={() => undefined}
            className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-[12px] font-[600]">
            Password
          </label>
          <Input
            type="password"
            value={user.password}
            name="password"
            action={() => undefined}
            className="!text-[#131313] !bg-[#ddd] !w-[350px]"
          />
        </div>
        <div>
          <label htmlFor="confirm_password" className="text-[12px] font-[600]">
            Confirm Password
          </label>
          <Input
            type="password"
            value={user.confirm_password}
            name="confirm_password"
            action={() => undefined}
            className="!text-[#131313] !bg-[#ddd] !w-[350px]"
          />
        </div>
        <div className="w-full mt-3">
          <Button
            text={false ? "Signing up..." : "Sign Up"}
            className="!text-[12px] w-full"
            type="submit"
            disabled={false}
          />
          <p className="text-[12px] mt-3">
            Already have an account?{" "}
            <Link to={"/login"} className="text-link">
              Log in
            </Link>
          </p>
        </div>
      </form>
    </section>
  )
}

export default CreateStore;