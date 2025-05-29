import logo from '@assets/logo-2.png';
import { useState } from 'react';
import { Input } from '@components/common/input/input';
import { Button } from '@components/common/buttons/button';
import { BASE_URL } from '@/src/utils/url';
import { Link, useNavigate } from 'react-router';

const Login: React.FC = (): React.ReactElement => {

  const [user, setUser] = useState<any>({
      email: '',
      password: '',
  });

  const [message, setMessage] = useState<string>();
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const navigate = useNavigate();
  
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

          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          setMessage(data.message);
          setIsSuccess(data.success);

          navigate("/");

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
     <section className="w-full flex flex-col justify-center items-center pt-10 min-h-[75vh] h-full">
      <div className="flex gap-1 items-center">
          <img src={logo} alt="logo" className="w-[80px] h-[80px]"/>
          <h1 className="font-[700] text-[2.5rem]">Login</h1>
      </div>
        <form className="flex flex-col gap-7 mt-10" onSubmit={handleSubmit}>
              <div>
                  <label htmlFor="Email" className="text-[12px] font-[600]">Email</label>
                  <Input type="email" value={user.email} name="email" placeholder="johndoes@example.com" action={handleChange} className="!text-primary-dark !bg-primary-light !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
              </div>
              <div>
                  <label htmlFor="password" className="text-[12px] font-[600]">Password</label>
                  <Input type="password" value={user.password} name="password" action={handleChange} className="!text-primary-dark !bg-primary-light !w-[350px]" />
              </div>
              <div className='w-full mt-2'>
                <Button text="Sign Up" className="!text-[12px] w-full" type="submit"/>
                <p className='text-[12px] mt-3'>Don't have an account yet? <Link to={'/sign-up'} className='text-link'>Sign up</Link></p>
              </div>
              { !isSuccess && <p className="text-[rgb(255,0,0)] text-[14px] font-[600] py-2 w-full text-center">{message}</p> }
        </form>
    </section>
  );
};

export default Login;