const StoreSkeleton: React.FC = () => {
  return (
    <div className="min-h-[50vh] w-full px-[200px] animate-pulse">
      {/* Store Header Skeleton */}
      <div className="w-full flex flex-col items-center mt-10">
        <div className='flex items-center gap-10'>
          {/* Avatar skeleton - 200x200 rounded-full */}
          <div className='w-[200px] h-[200px] rounded-full bg-gray-300'></div>
          
          <div className='flex flex-col items-start h-full'>
            {/* Store name skeleton */}
            <div className='h-6 bg-gray-300 rounded w-48 mb-2'></div>
            
            {/* Likes and sold skeleton */}
            <div className='flex gap-5 mb-2'>
              <div className='h-4 bg-gray-300 rounded w-16'></div>
              <div className='h-4 bg-gray-300 rounded w-16'></div>
            </div>
            
            {/* Active status skeleton */}
            <div className='flex gap-1 items-center'>
              <div className='w-[20px] h-[20px] bg-gray-300 rounded'></div>
              <div className='h-4 bg-gray-300 rounded w-32'></div>
            </div>
            
            {/* Instagram username skeleton */}
            <div className='flex gap-2 items-center mt-2'>
              <div className='w-[16px] h-[16px] bg-gray-300 rounded'></div>
              <div className='h-4 bg-gray-300 rounded w-24'></div>
            </div>
          </div>
        </div>
        
        {/* Bio skeleton */}
        <div className='mt-5 w-full max-w-md'>
          <div className='h-4 bg-gray-300 rounded w-full mb-2'></div>
          <div className='h-4 bg-gray-300 rounded w-3/4'></div>
        </div>
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-4 gap-4 items-center mt-10">
        {/* Add Item Button Skeleton */}
        {/* <div className="h-12 bg-gray-300 rounded p-5"></div> */}
        
        {/* Product Cards Skeleton  */}
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="group rounded-2xl transition-all duration-300 overflow-hidden w-full max-w-sm">
            {/* Image Container - aspect-square */}
            <div className="relative aspect-square overflow-hidden bg-gray-300 rounded-2xl">
              {/* Main Image Skeleton */}
              <div className="w-full h-full bg-gray-300"></div>
              
              {/* Image dots indicator skeleton */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {Array.from({ length: 3 }).map((_, dotIndex) => (
                  <div key={dotIndex} className="w-2 h-2 rounded-full bg-gray-400"></div>
                ))}
              </div>
              
              {/* Action buttons skeleton */}
              <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
                <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
              </div>
              
              {/* Image counter skeleton */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-gray-400 text-xs px-2 py-1 rounded-full z-10 w-8 h-5"></div>
            </div>
            
            {/* Product Info Skeleton */}
            <div className="px-4 mt-2 flex justify-between items-center">
              {/* Product Name */}
              <div className="h-4 bg-gray-300 rounded w-32"></div>
              
              {/* Price */}
              <div className="h-4 bg-gray-300 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreSkeleton;