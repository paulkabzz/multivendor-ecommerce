import { BASE_URL } from "@/src/utils/url";
import { useParams } from "react-router";

const ProductDetails: React.FC = (): React.ReactElement => {
  const { product_id } = useParams();

  const getProduct = async () => {
      try {
        const response = await fetch(`${BASE_URL}/get-product?product_id=${product_id}`, {
          method: "GET",
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to get product")
        }

        return data;
      } catch (error: unknown) {
        console.error(error);
        return error;
      }
  }
  
  return <div>{product_id}</div>;
};

export default ProductDetails;
