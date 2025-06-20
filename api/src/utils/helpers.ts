export const isValidUCTEmail = (email: string): boolean => {
    return /^[a-zA-Z]{6}[0-9]{3}@myuct\.ac\.za$/.test(email.trim().toLowerCase());
}

export const isStrongPassword = (password: string): boolean => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}).*$/.test(password) && password.length >= 8;
}

export const headers = { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
} as const;

export const isValidAppwriteImageUrl = (url: string, userId: string): boolean => {
    try {
        // This'll check if URL contains the expected pattern for the Appwrite instance
        const urlPattern = /\/storage\/buckets\/[^\/]+\/files\/[^\/]+\/(preview|view)/;
        const isValidPattern = urlPattern.test(url);
        
        return isValidPattern;
    } catch (error) {
        console.error('Error validating image URL:', error);
        return false;
    }
}