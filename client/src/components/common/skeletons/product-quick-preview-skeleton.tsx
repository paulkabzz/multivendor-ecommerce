const ProductQuickPreviewSkeleton: React.FC= () => {
  return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Product Images Skeleton */}
            <div className="space-y-4">
              {/* Main image skeleton */}
              <div className="aspect-square bg-gray-200 animate-pulse"></div>
              
            </div>

            {/* Product Details Skeleton */}
            <div className="space-y-4">
              {/* Header with actions skeleton */}
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  {/* Title skeleton */}
                  <div className="h-7 bg-gray-200 rounded animate-pulse w-4/5"></div>
                  {/* Brand skeleton */}
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  {/* Price skeleton */}
                  <div className="h-7 bg-gray-200 rounded animate-pulse w-1/3"></div>
                </div>
              </div>


              {/* Product details grid skeleton */}
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
                  </div>
                ))}
              </div>

              {/* Seller info skeleton */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>
                </div>
              </div>

              {/* Action buttons skeleton */}
              <div className="space-y-3 pt-4">
                <div className="w-full h-12 bg-gray-200 rounded-[100px] animate-pulse"></div>
                <div className="w-full h-12 bg-gray-200 rounded-[100px] animate-pulse"></div>
              </div>
            </div>
          </div>
  );
};

export default ProductQuickPreviewSkeleton;