import { BASE_URL } from "@/src/utils/url";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

interface Product {
  product_id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: string;
  condition: string;
  created_at: string;
  is_available: boolean;

}

const ProductDetails: React.FC = (): React.ReactElement => {
  const { product_id } = useParams();
  const [product, setProduct] = useState<Product>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {

      const getProduct = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`${BASE_URL}/get-product?product_id=${product_id}`, {
            method: "GET",
          });

          const data = await response.json();
          console.log(data)
          if (!data.success) {
            setError(data.message)
            throw new Error(data.message || "Failed to get product")
          }

          setProduct(data.product);
          setIsLoading(false);

        } catch (error: unknown) {
          console.error(error);
          return error;
        }
      }

      getProduct().catch(error => console.error(error));

  }, []);

  if (error) return <div>{error}</div>;
  return  <div>{isLoading ? "Loading...." : product?.product_id}</div>;
};

export default ProductDetails;
