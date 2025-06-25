import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/url";
const token = localStorage.getItem('token');

const getUser = async () => {
    const resposne = await fetch(`${BASE_URL}/get-me`, {
       headers: {
         Authorization: `Bearer ${token}`,
       },
       method: "GET"
    });

    return await resposne.json();
}

export const useUser = () => {
    return useQuery({
    queryKey: ['user'],
    queryFn: getUser
})
}
