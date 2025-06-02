export const isValidUCTEmail = (email: string): boolean => {
    return /^[a-zA-Z]{6}[0-9]{3}@myuct\.ac\.za$/.test(email.trim().toLowerCase());
}

export const isStrongPassword = (password: string): boolean => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}).*$/.test(password) || password.length < 8;
}