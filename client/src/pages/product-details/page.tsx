import { Button } from "@/src/components/common/buttons/button";
import { formatString, formatTimeAgo } from "@/src/utils/helpers";
import { BASE_URL } from "@/src/utils/url";
import { Heart, Share2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

interface Image {
  image_url: string;
}

type TCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "BAD";

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
  condition: TCondition;
  is_available: boolean;
  created_at: string;
  image: Image[];
  vendor: Vendor;
  department: Department;
  subcategory: Subcategory;
  brands: Brand;
  sizes: Size;
}

// Loading Skeleton Component
const ProductDetailsSkeleton: React.FC = (): React.ReactElement => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images Skeleton */}
          <div className="space-y-6">
            <div className="aspect-square bg-gray-200 rounded animate-pulse"></div>
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-20 h-20 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Product Details Skeleton */}
          <div className="flex flex-col">
            {/* Title, Brand and Price Skeleton */}
            <div className="flex flex-col gap-3">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-7 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Description Skeleton */}
            <div className="mt-2 space-y-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>

            {/* Call to action Skeleton */}
            <div className="flex flex-col gap-4 mt-10">
              <div className="h-[50px] bg-gray-200 rounded animate-pulse"></div>
              <div className="h-[50px] bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Product Information Grid Skeleton */}
            <div className="mt-8 mb-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seller Information Skeleton */}
            <div className="mt-6 mb-8 py-4 px-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Product Meta Information Skeleton */}
            <div className="mt-6 border-t pt-4 space-y-2">
              <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    return <ProductDetailsSkeleton />;
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
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 ">
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
                    className={`flex-shrink-0 w-20 h-20 overflow-hidden border-5 transition-all duration-200 ${
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

          
        <div className="flex flex-col">

              {/* Title, Brand and Price */}
            <div className="flex flex-col gap-3">
                <h1 className="font-bold text-3xl">
                  {product.name}
                </h1>

                {
                  product.brands && <span className="mb-10"><h3 onClick={() => navigate(`/brands?brand=${product.brands.brand_name}`)} className="font-bold cursor-pointer text-[12px] text-link w-[60px]">{product.brands.brand_name}</h3></span>
                }

                <h2 className="text-2xl font-bold">
                  {formatPrice(product.price)}
                </h2>
            </div>

            {/* Description */}
            <p className="text-[#777] text-[12px] mt-2">
              {product.decsription}
            </p> 

            {/* Call to action */}
            <div className="flex flex-col gap-4 mt-10">
                <Button text="Buy Now" className="!text-[12px] w-full !h-[50px] font-bold"/>
                <Button text="Message Seller" className="!text-[12px] w-full !h-[50px] border-2 border-solid border-black bg-white !text-primary-dark font-bold hover:bg-[#eee9]"/>
            </div>  

            {/* Product Information Grid */}
            <div className="mt-8 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-[#131313]">Product Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Condition */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#777]">Condition</label>
                        <Condition condition={product.condition} />
                    </div>

                    {/* Size */}
                    {
                      product.sizes && (
                      <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium text-[#777]">Size</label>
                          <div className="bg-gray-100 max-w-[200px] min-w-[60px] text-center text-[12px] py-2 px-3 rounded-full border border-gray-300 font-medium">
                              {product.sizes.size_name }
                          </div>
                      </div>
                      )
                    }

                    {/* Department */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#777]">Department</label>
                        <div className="bg-blue-50 max-w-[200px] min-w-[60px] text-center text-[12px] py-2 px-3 rounded-full border border-blue-200 font-medium text-blue-800">
                            {product.department.department_name}
                        </div>
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#777]">Category</label>
                        <div className="bg-purple-50 max-w-[200px] min-w-[60px] text-center text-[12px] py-2 px-3 rounded-full border border-purple-200 font-medium text-purple-800">
                            {product.subcategory.categorysubcategory[0]?.category.category_name || 'N/A'}
                        </div>
                    </div>

                    {/* Subcategory */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#777]">Subcategory</label>
                        <div className="bg-indigo-50 max-w-[200px] min-w-[60px] text-center text-[12px] py-2 px-3 rounded-full border border-indigo-200 font-medium text-indigo-800">
                            {product.subcategory.subcategory_name}
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-[#777]">Availability</label>
                        <div className={`max-w-[200px] min-w-[60px] text-center text-[12px] py-2 px-3 rounded-full border font-medium ${
                            product.is_available 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                            {product.is_available ? 'Available' : 'Sold Out'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Seller Information */}
            <div className="mt-6 mb-8 py-4 px-8 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-[14px] font-semibold mb-3 text-primary-dark">Seller Information</h3>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        <img 
                            src={product.vendor.avatar_url} 
                            alt={product.vendor.store_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMjQiIGZpbGw9IiNEREREREQiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBzdHlsZT0idHJhbnNsYXRlOiA1MCUgNTAlOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLCAtNTAlKTsiPgo8cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA5IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwOSA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOTk5OTk5Ii8+CjxwYXRoIGQ9Ik0xMiAxNEM4LjY4NjI5IDE0IDYgMTYuNjg2MyA2IDIwVjIySDhWMjBDOCAxNy43OTA5IDkuNzkwODYgMTYgMTIgMTZDMTQuMjA5MSAxNiAxNiAxNy43OTA5IDE2IDIwVjIySDhWMjBDOCAxNi42ODYzIDEwLjY4NjMgMTQgMTQgMTQgMTcuMzEzNyAxNCAyMCAxNi42ODYzIDIwIDIwVjIySDIyVjIwQzIyIDE2LjY4NjMgMTkuMzEzNyAxNCAxNiAxNFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+Cg==';
                            }}
                        />
                    </div>
                    <div>
                        <p className="font-bold text-[#131313]">{product.vendor.store_name}</p>
                        <p className="text-[12px] text-[#777]">
                            Last active: {formatTimeAgo(product.vendor.last_active)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Product Meta Information */}
            <div className="mt-6 text-[12px] text-[#777] border-t pt-4">
                <p>Listed {formatTimeAgo(product.created_at)}</p>
                <p className="mt-1">Product ID: {product.product_id}</p>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;



const Condition = ({condition}: {condition: TCondition}): React.ReactElement => {
 switch(condition) {
    case "NEW":
    case "LIKE_NEW":
      return <div className="bg-green-200 max-w-[200px] text-center text-[12px] py-2 rounded-full border-1 border-solid border-black">{formatString(condition)}</div>;
    case "FAIR":
      return <div className="bg-yellow-200 max-w-[200px] text-center text-[12px] py-2 rounded-full border-1 border-solid border-black">{formatString(condition)}</div>;
    case "BAD":
      return <div className="bg-red-200 max-w-[200px] text-center text-[12px] py-2 rounded-full border-1 border-solid border-black">{formatString(condition)}</div>;
    default:
      return <div className="bg-blue-200 max-w-[200px] text-center text-[12px] py-2 rounded-full border-1 border-solid border-black">{formatString(condition)}</div>;

 }
}