import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, Grid, List, Loader2 } from 'lucide-react';
import { ShoppingCard } from '@components/common/shopping-card/shopping-card';
import { ComboBox } from '@/src/components/common/input/combo-box';
import searchIcon from '@assets/icons/search-d.png';
import { 
  useDepartments, 
  useCategories, 
  useSubcategories, 
  useBrands, 
  useSizes
} from '@src/context/ui-context';
import { BASE_URL } from '@utils/url';
import { Input } from '@/src/components/common/input/input';

interface Product {
  product_id: string;
  name: string;
  price: number;
  img_url?: string;
  image?: Array<{ image_url: string }>;
  condition: string;
  is_available: boolean;
  vendor: {
    users: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  };
  brands: {
    brand_name: string;
  };
  sizes: {
    size_name: string;
  };
  department: {
    department_name: string;
  };
  subcategory: {
    subcategory_name: string;
    categorysubcategory: Array<{
      category: {
        category_name: string;
      };
    }>;
  };
}

interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

const Department: React.FC = () => {
  const [searchParams, _setSearchParams] = useSearchParams();
  const departmentId = searchParams.get('departmentId');
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, _setSortBy] = useState<string>('created_at');
  const [sortOrder, _setSortOrder] = useState<string>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // API queries
  const { data: departments } = useDepartments();
  const { data: categories } = useCategories(departmentId || '');
  const { data: subcategories } = useSubcategories(departmentId || '', selectedCategory);
  const { data: brands } = useBrands();
  const { data: sizes } = useSizes();

  // Get current department name
  const currentDepartment = departments?.find(dept => dept.department_id === departmentId);

  // Build query params for products API
  const buildProductQuery = () => {
    const params = new URLSearchParams();
    if (departmentId) params.append('departmentId', departmentId);
    if (selectedCategory) params.append('categoryId', selectedCategory);
    if (selectedSubcategory) params.append('subcategory_id', selectedSubcategory);
    if (selectedBrand) params.append('brandId', selectedBrand);
    if (selectedSize) params.append('sizeId', selectedSize);
    if (selectedCondition) params.append('condition', selectedCondition);
    if (searchQuery) params.append('search', searchQuery);
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    params.append('page', currentPage.toString());
    params.append('limit', '20');
    return params.toString();
  };

  // Fetch products
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products', departmentId, selectedCategory, selectedSubcategory, selectedBrand, selectedSize, selectedCondition, searchQuery, sortBy, sortOrder, currentPage],
    queryFn: async (): Promise<ProductsResponse> => {
      const queryString = buildProductQuery();
      console.log('Fetching products with query:', `${BASE_URL}/get-products?${queryString}`);
      const response = await fetch(`${BASE_URL}/get-products?${queryString}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      const data = await response.json();
      console.log('Products response:', data);
      return data;
    },
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000, //every 5 mins
  });

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategory) {
      setSelectedSubcategory('');
    }
  }, [selectedCategory]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubcategory, selectedBrand, selectedSize, selectedCondition, searchQuery, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedBrand('');
    setSelectedSize('');
    setSelectedCondition('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory || selectedSubcategory || selectedBrand || selectedSize || selectedCondition || searchQuery;

  if (!departmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Department Not Found</h2>
          <p className="text-gray-600">Please select a valid department.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
        <div className={`max-w-7xl mx-auto overflow-hidden h-[300px] bg-top bg-cover`} style={{backgroundImage: `url(${currentDepartment?.department_cover})`}}>
        {/* <img src={currentDepartment?.department_cover} alt="" className='object-cover w-full h-full' /> */}
          <div className="flex  sm:flex-row  sm:justify-between gap-4 w-full h-full bg-[rgba(0,0,0,0.6)] px-10 pb-5">
            <div className='flex flex-col justify-end '>
              <h1 className="text-[3rem] text-white font-bold">
                {currentDepartment?.department_name || 'Department'}
              </h1>
              {productsData && (
                <p className="text-primary-light mt-1 text-[14px]">
                  {productsData.data.pagination.totalCount} products found
                </p>
              )}
            </div>
            
            <div className="flex items-end gap-3">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Filter size={18} />
                Filters
                {hasActiveFilters && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Filters */}
          <div className={`w-[400px] shrink-0 ${showFilters ? 'block' : 'hidden'} sm:block`}>
            <div className="bg-white border border-solid border-[#f3f3f3] p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[12px] font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-[12px] text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-6 flex items-center flex-col justify-between">
                {/* Search */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-2">
                    Search Products
                  </label>
                  <div className="relative">
                    <Input
                      icon={searchIcon}
                      type="text"
                      value={searchQuery}
                      action={(e: any) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or description..."
                      width={350}
                      className='text-primary-dark bg-primary-light'
                    />
                  </div>
                </div>

                {/* Sort */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg  text-sm"
                    >
                      <option value="created_at">Date Added</option>
                      <option value="name">Name</option>
                      <option value="price">Price</option>
                    </select>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg  text-sm"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </div> */}

                {/* Category */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <ComboBox
                    options={[
                      { value: '', label: 'All Categories' },
                      ...(categories?.map(cat => ({
                        value: cat.category_id,
                        label: cat.category_name
                      })) || [])
                    ]}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    placeholder="Select Category"
                    bgLight={true}
                    width={350}
                    // height={40}
                    className='w-full'
                  />
                </div>

                {/* Subcategory */}
                {selectedCategory && subcategories && subcategories.length > 0 && (
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 mb-2">
                      Subcategory
                    </label>
                    <ComboBox
                      options={[
                        { value: '', label: 'All Subcategories' },
                        ...subcategories.map(sub => ({
                          value: sub.subcategory_id,
                          label: sub.subcategory_name
                        }))
                      ]}
                      value={selectedSubcategory}
                      onChange={setSelectedSubcategory}
                      placeholder="Select Subcategory"
                      bgLight={true}
                      width={350}
                    //   height={40}
                    />
                  </div>
                )}

                {/* Brand */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <ComboBox
                    options={[
                      { value: '', label: 'All Brands' },
                      ...(brands?.map(brand => ({
                        value: brand.brand_id,
                        label: brand.brand_name
                      })) || [])
                    ]}
                    value={selectedBrand}
                    onChange={setSelectedBrand}
                    placeholder="Select Brand"
                    bgLight={true}
                    width={350}
                    // height={40}
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <ComboBox
                    options={[
                      { value: '', label: 'All Sizes' },
                      ...(sizes?.map(size => ({
                        value: size.size_id,
                        label: size.size_name
                      })) || [])
                    ]}
                    value={selectedSize}
                    onChange={setSelectedSize}
                    placeholder="Select Size"
                    bgLight={true}
                    width={350}
                    // height={40}
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <ComboBox
                    options={[
                      { value: '', label: 'All Conditions' },
                      { value: 'NEW', label: 'New' },
                      { value: 'LIKE_NEW', label: 'Like New' },
                      { value: 'GOOD', label: 'Good' },
                      { value: 'FAIR', label: 'Fair' },
                      { value: 'BAD', label: 'Bad' }
                    ]}
                    value={selectedCondition}
                    onChange={setSelectedCondition}
                    placeholder="Select Condition"
                    bgLight={true}
                    width={350}
                    // height={40}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 min-h-[30vh]">
                <Loader2 size={36} className="animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-2">Error loading products</div>
                <p className="text-gray-600">Please try again later.</p>
              </div>
            ) : !productsData?.data.products.length ? (
              <div className="text-center py-12">
                <div className="text-gray-900 text-xl font-bold mb-2">No products found</div>
                <p className="text-gray-600 mb-4 text-[12px]">Try adjusting your filters or search terms.</p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className={`${
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6' 
                    : 'space-y-4'
                }`}>
                  {productsData.data.products.map((product) => (
                    <ShoppingCard
                      key={product.product_id}
                      name={product.name}
                      price={product.price}
                      img_url={product.img_url}
                      images={product.image || []}
                      product_id={product.product_id}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {productsData.data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!productsData.data.pagination.hasPrevPage}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, productsData.data.pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(
                          productsData.data.pagination.totalPages - 4,
                          Math.max(1, currentPage - 2)
                        )) + i;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 rounded-lg ${
                              pageNum === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!productsData.data.pagination.hasNextPage}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Department;