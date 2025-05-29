import logo from '@assets/logo-2.png';
import { useState, useEffect } from 'react';
import { Input } from '@components/common/input/input';
import { Button } from '@components/common/buttons/button';
import { Link, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { loginUser, clearError } from '@/src/store/slices/userSlice';

const Login: React.FC = (): React.ReactElement => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector(state => state.user);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
    
    // Clear any previous errors when component mounts
    dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    dispatch(loginUser(credentials));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials({ ...credentials, [name]: value });
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
          <Input 
            type="email" 
            value={credentials.email} 
            name="email" 
            placeholder="johndoes@example.com" 
            action={handleChange} 
            className="!text-primary-dark !bg-primary-light !w-[350px] placeholder:text-[11px] placeholder:font-[600]" 
          />
        </div>
        <div>
          <label htmlFor="password" className="text-[12px] font-[600]">Password</label>
          <Input 
            type="password" 
            value={credentials.password} 
            name="password" 
            action={handleChange} 
            className="!text-primary-dark !bg-primary-light !w-[350px]" 
          />
        </div>
        <div className='w-full mt-2'>
          <Button 
            text={loading ? "Logging in..." : "Login"} 
            className="!text-[12px] w-full" 
            type="submit"
            disabled={loading}
          />
          <p className='text-[12px] mt-3'>Don't have an account yet? <Link to={'/sign-up'} className='text-link'>Sign up</Link></p>
        </div>
        {error && <p className="text-[rgb(255,0,0)] text-[14px] font-[600] py-2 w-full text-center">{error}</p>}
      </form>
    </section>
  );
};

export default Login;