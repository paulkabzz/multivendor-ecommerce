import type { IUser } from "./types";

export const signUpValidation = (user: IUser, setErrors: (a: any) => any): boolean => {
        const newErrors: Partial<IUser> = {};
    
    if (!user.first_name.trim() || user.first_name.trim() === "") {
      newErrors.first_name = 'First name is required';
    }
    
    if (!user.last_name.trim() || user.last_name.trim() === "") {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!user.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[a-zA-z]{6}[0-9]{3}@myuct\.ac\.za$/i.test(user.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (user.phone && !/^\+?[\d\s\-\(\)]+$/.test(user.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
}