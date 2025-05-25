import { Button } from "@/src/components/common/buttons/button";
import { Input } from "@/src/components/common/input/input";
import type { IUser } from "@utils/types";
import logo from '@assets/logo-2.png';
import { useState } from "react";

const SignUp: React.FC = (): React.ReactElement => {

  const BASE_URL = "http://localhost:7071/api";

  const [user, setUser] = useState<IUser | any>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState<any>({});

  const handleChange = (event: any) => {
      const { name, value } = event.target;
      setUser({ ...user, [name]: value });
  };

  const handleSubmit = async (event: any) => {
        event.preventDefault();

        const headers = {
          method: 'POST',
          headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
          },
          body: user,
        };

        const newErrors = validateForm(user);
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {

          try {
            const response = await fetch(`${BASE_URL}/sign-up`, headers);
            
            if (!response.ok) throw new Error("Error signing up");

            console.log("Submitted");

            return response.json();

          } catch (error) {
              console.error("Error: ", error);
          }
            
        } else {
            console.log('Form submission failed due to validation errors.');
        }

  };

  const validateForm = (data: any) => {
      const errors: any = {};

      if (!data.first_name.trim()) {
          errors.first_name = 'Username is required';
      } else if (data.first_name.length === 0) {
          errors.first_name = 'Username must be at least 4 characters long';
      }

      if (!data.email.trim()) {
          errors.email = 'Email is required';
      } else if (!/^[a-zA-z]{6}[0-9]{3}@myuct\.ac\.za$/i.test(data.email)) {
          errors.email = data.email.trim() + ' is not a valid uct email.';
      }

      if (!data.password) {
          errors.password = 'Password is required';
      } else if (data.password.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}).*$/.test(data.password)) {
          errors.password = 'Password must container at least 1 number, 1 uppercase letter, 1 special character, and must be at least 8 characters long.';
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
                  { errors.first_name && <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">{errors.first_name}</p> }
                  <Input type="text" value={user.first_name} name="first_name" action={handleChange} placeholder="John" className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
              </div>
              <div>
                  <label htmlFor="Last Name" className="text-[12px] font-[600]">Last Name</label>
                  { errors.last_name && <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">{errors.last_name}</p> }
                  <Input type="text" value={user.last_name} name="last_name" placeholder="Doe" action={handleChange} className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
              </div>
              <div>
                  <label htmlFor="Email" className="text-[12px] font-[600]">Email</label>
                  { errors.email && <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">{errors.email}</p> }
                  <Input type="email" value={user.email} name="email" placeholder="johndoes@example.com" action={handleChange} className="!text-[#131313] !bg-[#ddd] !w-[350px] placeholder:text-[11px] placeholder:font-[600]" />
              </div>
              <div>
                  <label htmlFor="password" className="text-[12px] font-[600]">Password</label>
                    { errors.password && <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">{errors.password}</p> }
                  <Input type="password" value={user.password} name="password" action={handleChange} className="!text-[#131313] !bg-[#ddd] !w-[350px]" />
              </div>
               <div>
                  <label htmlFor="confirm_password" className="text-[12px] font-[600]">Password</label>
                    { errors.confirm_password && <p className="text-[rgb(255,0,0)] text-[12px] font-[600] py-2">{errors.confirm_password}</p> }
                  <Input type="password" value={user.confirm_password} name="confirm_password" action={handleChange} className="!text-[#131313] !bg-[#ddd] !w-[350px]" />
              </div>
              <Button text="Sign Up" className="!text-[12px]" type="submit"/>  
        </form>
    </section>
  )
}

export default SignUp;