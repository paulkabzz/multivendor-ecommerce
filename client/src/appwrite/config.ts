import { Client, Storage } from "appwrite";

export const appwriteConfig = {
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  userProfilePicBucketId: import.meta.env.VITE_APPWRITE_USER_PROFILE_PICS_BUCKET_ID,
  url: import.meta.env.VITE_APPWRITE_URL,
} as const;

export const client: Client = new Client().setEndpoint(appwriteConfig.url).setProject(appwriteConfig.projectId);

export const storage: Storage = new Storage(client);
