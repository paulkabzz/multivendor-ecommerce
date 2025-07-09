import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { BASE_URL } from "@/src/utils/url";
import { formatString, formatTimeAgo } from "@/src/utils/helpers";
import { Button } from '@components/common/buttons/button';
import ProductQuickPreviewSkeleton from '@components/common/skeletons/product-quick-preview-skeleton';

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

interface ProductQuickPreviewProps {
  product_id: string;
  isOpen: boolean;
  onClose: () => void;
}

const fetchProduct = async (productId: string): Promise<Product> => {
  const response = await fetch(`${BASE_URL}/get-product?product_id=${productId}`, {
    method: "GET",
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || "Failed to get product");
  }

  return data.product;
};

const Condition = ({condition}: {condition: TCondition}): React.ReactElement => {
  switch(condition) {
    case "NEW":
    case "LIKE_NEW":
      return <div className="bg-green-200 max-w-[200px] text-center text-[10px] py-1 px-2 rounded-full border border-green-300 text-green-800">{formatString(condition)}</div>;
    case "FAIR":
      return <div className="bg-yellow-200 max-w-[200px] text-center text-[10px] py-1 px-2 rounded-full border border-yellow-300 text-yellow-800">{formatString(condition)}</div>;
    case "BAD":
      return <div className="bg-red-200 max-w-[200px] text-center text-[10px] py-1 px-2 rounded-full border border-red-300 text-red-800">{formatString(condition)}</div>;
    default:
      return <div className="bg-blue-200 max-w-[200px] text-center text-[10px] py-1 px-2 rounded-full border border-blue-300 text-blue-800">{formatString(condition)}</div>;
  }
};

const ProductQuickPreview: React.FC<ProductQuickPreviewProps> = ({ product_id, isOpen, onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const navigate = useNavigate();

  const {
    data: product,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['product', product_id],
    queryFn: () => fetchProduct(product_id),
    enabled: !!product_id && isOpen,
    staleTime: 60 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Set selected image when product data is loaded
  useEffect(() => {
    if (product?.image && product.image.length > 0) {
      setSelectedImage(product.image[0].image_url);
      setCurrentImageIndex(0);
    }
  }, [product]);

  // Handle escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const formatPrice = (price: string): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(parseFloat(price));
  };

  const nextImage = () => {
    if (product?.image && product.image.length > 1) {
      const nextIndex = (currentImageIndex + 1) % product.image.length;
      setCurrentImageIndex(nextIndex);
      setSelectedImage(product.image[nextIndex].image_url);
    }
  };

  const prevImage = () => {
    if (product?.image && product.image.length > 1) {
      const prevIndex = (currentImageIndex - 1 + product.image.length) % product.image.length;
      setCurrentImageIndex(prevIndex);
      setSelectedImage(product.image[prevIndex].image_url);
    }
  };

  const handleViewProduct = () => {
    onClose();
    navigate(`/product/${product_id}`);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Loading state */}
        {isLoading && (
            <ProductQuickPreviewSkeleton />
        )}

        {/* Error state */}
        {isError && (
          <div className="p-8 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-500 mb-2">Failed to load product</p>
              <p className="text-gray-500 text-sm">
                {error instanceof Error ? error.message : 'Something went wrong'}
              </p>
            </div>
          </div>
        )}

        {/* Product content */}
        {product && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-50 overflow-hidden relative">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation arrows for multiple images */}
                {product.image && product.image.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>

            </div>

            {/* Product Details */}
            <div className="space-y-4">
              {/* Header with actions */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#131313] mb-2">
                    {product.name}
                  </h2>
                  {product.brands && (
                    <p className="text-sm text-blue-600 font-bold mb-3 cursor-pointer hover:text-blue-700">
                      {product.brands.brand_name}
                    </p>
                  )}
                  <p className="text-2xl font-bold text-[#131313] mb-2">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </div>


              {/* Key product details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Condition</label>
                  <Condition condition={product.condition} />
                </div>
                {product.sizes && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Size</label>
                    <div className="bg-gray-100 max-w-[200px] text-center text-[10px] py-1 px-2 rounded-full border border-gray-300 font-medium">
                      {formatString(product.sizes.size_name)}
                    </div>
                  </div>
                )}
              </div>

              {/* Seller info */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 cursor-pointer" onClick={() => navigate(`/store/${product.vendor.vendor_id}`)}>
                    <img 
                      src={product.vendor.avatar_url} 
                      alt={product.vendor.store_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNEREREREQiLz4KPC9zdmc+';
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#131313] cursor-pointer hover:text-blue-600" onClick={() => navigate(`/store/${product.vendor.vendor_id}`)}>
                      {product.vendor.store_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Active {formatTimeAgo(product.vendor.last_active)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  action={handleViewProduct}
                  text='View Full Details'
                  className="w-full font-bold !text-[12px]"
                />
                  
                <Button
                    text='Visit Store'
                  action={() => navigate(`/store/${product.vendor.vendor_id}`)}
                  className="w-full !border-2 !border-solid !border-[#131313] !text-[#131313] !bg-white font-bold !text-[12px] hover:!bg-primary-light"
                />
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductQuickPreview;