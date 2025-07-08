import { BASE_URL } from "@/src/utils/url";
import { useState } from "react";
import { useParams } from "react-router";

const Store: React.FC = (): React.ReactElement => {
    const { store_id } = useParams();
    const [store, setStore] = useState<any>();

    const fetchStore = async () => {
        try {
            const response = await fetch(`${BASE_URL}/get-store`);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not get store")
            }

            return data.store;
        } catch (error) {
            console.error(error);
            return error;
        }
    }
    
  return (
    <div>Store ID: {store_id}</div>
  )
}

export default Store;