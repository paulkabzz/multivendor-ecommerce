import logo from '@assets/logo-2.png';
import { useState } from 'react';
import { Input } from '@components/common/input/input';
import { Button } from '@components/common/buttons/button';
import { BASE_URL } from '@/src/utils/url';

const Login: React.FC = (): React.ReactElement => {

  const [user, setUser] = useState<any>({
      email: '',
      password: '',
  });

  const [message, setMessage] = useState<string>();
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  
  const handleSubmit = async (event: any) => {
    event.preventDefault();
      try {

          const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
          });

          const data = await response.json();

          console.log(data.user);

          setMessage(data.message);
          setIsSuccess(data.success);

      } catch (error) {
          console.error(error);
          setIsSuccess(false);
          setMessage("Failed to login.");
          return error;
      }
  };

  const handleChange = (event: any) => {
      const { name, value } = event.target;
      setUser({ ...user, [name]: value });
  };

  return (
     <section className="w-full flex flex-col justify-center items-center pt-10">
      <div className="flex gap-1 items-center">
          <img src={logo} alt="logo" className="w-[80px] h-[80px]"/>
          <h1 className="font-[700] text-[2.5rem]">Login</h1>
      </div>
        <form className="flex flex-col gap-7 mt-10" onSubmit={handleSubmit}>
              <div>
                  <label htmlFor="Email" className="text-[12px] font-[600]">Email</label>
                  <Input type="email" value={user.email} name="email" placeholder="johndoes@example.com" action={handleChange} className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
              </div>
              <div>
                  <label htmlFor="password" className="text-[12px] font-[600]">Password</label>
                  <Input type="password" value={user.password} name="password" action={handleChange} className="!text-[#131313] !bg-[#ddd] !w-[350px]" />
              </div>
              <Button text="Sign Up" className="!text-[12px]" type="submit"/>  
              { !isSuccess && <p className="text-[rgb(255,0,0)] text-[14px] font-[600] py-2 w-full text-center">{message}</p> }
        </form>
    </section>
  );
};

export default Login;