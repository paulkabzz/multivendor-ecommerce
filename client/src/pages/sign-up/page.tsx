import { Button } from "@/src/components/common/buttons/button";
import { Input } from "@/src/components/common/input/input";
import type { IUser } from "@utils/types";
import logo from '@assets/logo-2.png';
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { signupUser, clearError } from '@/src/store/slices/userSlice';

const SignUp: React.FC = (): React.ReactElement => {
  const [user, setUser] = useState<IUser | any>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState<any>({});
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector(state => state.user);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
    
    // Clear any previous errors when component mounts
    dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const newErrors = validateForm(user);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Remove confirm_password as it's not needed in the API
      const { confirm_password, ...userData } = user;
      dispatch(signupUser(userData));

      // Reset form fields
      // setUser({
      //   first_name: '',
      //   last_name: '',
      //   email: '',
      //   password: '',
      //   confirm_password: ''
      // });
      // setErrors({});
    }
  };

  const validateForm = (data: IUser & {confirm_password: string}) => {
    const errors: any = {};

    if (!data.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    
    if (!data.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[a-zA-z]{6}[0-9]{3}@myuct\.ac\.za$/i.test(data.email.trim().toLowerCase())) {
      errors.email = data.email.trim() + ' is not a valid UCT email.';
    }

    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}).*$/.test(data.password)) {
      errors.password = 'Password must contain at least 1 number, 1 uppercase letter, 1 special character, and must be at least 8 characters long.';
    }

    if (data.confirm_password !== data.password) {
      errors.confirm_password = 'Passwords do not match';
    }

    return errors;
  };

  return (
    <section className="w-full flex flex-col justify-center items-center pt-10">
      <div className="flex gap-1 items-center">
        <img src={logo} alt="logo" className="w-[80px] h-[80px]"/>
        <h1 className="font-[700] text-[2.5rem]">Sign Up</h1>
      </div>
      <form className="flex flex-col gap-7 mt-10" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="first_name" className="text-[12px] font-[600]">First Name</label>
          {errors.first_name && <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">{errors.first_name}</p>}
          <Input type="text" value={user.first_name} name="first_name" action={handleChange} placeholder="John" className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
        </div>
        <div>
          <label htmlFor="Last Name" className="text-[12px] font-[600]">Last Name</label>
          {errors.last_name && <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">{errors.last_name}</p>}
          <Input type="text" value={user.last_name} name="last_name" placeholder="Doe" action={handleChange} className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
        </div>
        <div>
          <label htmlFor="Email" className="text-[12px] font-[600]">Email</label>
          {errors.email && <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">{errors.email}</p>}
          <Input type="email" value={user.email} name="email" placeholder="johndoes@example.com" action={handleChange} className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
        </div>
        <div>
          <label htmlFor="password" className="text-[12px] font-[600]">Password</label>
          {errors.password && <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">{errors.password}</p>}
          <Input type="password" value={user.password} name="password" action={handleChange} className="!text-[#131313] !bg-[#ddd] !w-[350px]" />
        </div>
        <div>
          <label htmlFor="confirm_password" className="text-[12px] font-[600]">Confirm Password</label>
          {errors.confirm_password && <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">{errors.confirm_password}</p>}
          <Input type="password" value={user.confirm_password} name="confirm_password" action={handleChange} className="!text-[#131313] !bg-[#ddd] !w-[350px]" />
        </div>
        <div className="w-full mt-3">
          <Button 
            text={loading ? "Signing up..." : "Sign Up"} 
            className="!text-[12px] w-full" 
            type="submit"
            disabled={loading}
          />  
          <p className='text-[12px] mt-3'>Already have an account? <Link to={'/login'} className='text-link'>Log in</Link></p>
        </div>
        {error && <p className="text-[rgb(255,0,0)] text-[14px] font-[600] py-2 w-full text-center">{error}</p>}
      </form>
    </section>
  );
};

export default SignUp;