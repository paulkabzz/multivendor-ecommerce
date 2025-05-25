export function validUniEmail (email: string): boolean {
    const regex = /^[a-zA-z]{6}[0-9]{3}@myuct\.ac\.za$/i;
    return regex.test(email);
};

