import { formatString } from "@/src/utils/helpers";
import { BASE_URL } from "@/src/utils/url";
import { Loader2, Heart, Share2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

interface Image {
  image_url: string;
}

interface Vendor {
  vendor_id: string;
  avatar_url: string;
  store_name: string;
  last_active: string;
}

interface Department {
  department_id: string;
  department_name: string;
}

interface Category {
  category_id: string;
  category_name: string;
}

interface CategorySubcategory {
  category: Category;
}

interface Subcategory {
  subcategory_id: string;
  subcategory_name: string;
  categorysubcategory: CategorySubcategory[];
}

interface Brand {
  brand_name: string;
}

interface Size {
  size_name: string;
}

interface Product {
  product_id: string;
  name: string;
  decsription: string;
  price: string;
  condition: string;
  is_available: boolean;
  created_at: string;
  image: Image[];
  vendor: Vendor;
  department: Department;
  subcategory: Subcategory;
  brands: Brand;
  sizes: Size;
}

const ProductDetails: React.FC = (): React.ReactElement => {
  const { product_id } = useParams();
  const [product, setProduct] = useState<Product>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const navigate = useNavigate();

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
        if (data.product.image && data.product.image.length > 0) {
          setSelectedImage(data.product.image[0].image_url);
        }
        setIsLoading(false);

      } catch (error: unknown) {
        console.error(error);
        setError("Failed to load product");
        setIsLoading(false);
      }
    }

    if (product_id) {
      getProduct().catch(error => console.error(error));
    }
  }, [product_id]);

  const formatPrice = (price: string): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(parseFloat(price));
  };

  const copyUrl = (): void => {
    const url: string = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000);
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#ddd] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#131313] mx-auto mb-4"/>
          <p className="text-[#131313] text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#ddd] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-[#131313] text-xl mb-4 font-semibold">{error}</div>
          <button className="px-8 py-3 bg-[#131313] text-[#ddd] rounded-lg hover:bg-gray-800 transition-colors font-medium">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#ddd] flex items-center justify-center">
        <div className="text-[#131313] text-xl font-semibold">Product not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
{
  copied && (
    <div className="fixed top-[15vh] left-1/2 transform -translate-x-1/2 z-[100000] transition-opacity duration-300 ease-in-out">
      <div className="bg-[#131313] text-white px-6 py-3 text-[12px] flex items-center gap-2">
          Copied to clipboard!
      </div>
    </div>
  )
}
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button className="flex items-center gap-2 text-[#131313] hover:text-gray-600 transition-colors font-medium" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={copyUrl}>
              <Share2 size={20} className="text-[#131313]" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Heart size={20} className="text-[#131313]" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="aspect-square bg-white  overflow-hidden ">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.image && product.image.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.image.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === img.image_url 
                        ? 'border-[#131313] shadow-md scale-105' 
                        : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

  
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

