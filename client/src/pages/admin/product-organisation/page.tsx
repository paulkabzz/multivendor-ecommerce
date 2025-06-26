import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/src/context/admin-context';
import { Upload, Plus, Building2, Grid3X3, Layers3, X, Check, AlertCircle } from 'lucide-react';

const CatalogPanel: React.FC = () => {
  const {
    // Department
    isCreateDepartmentLoading,
    createDepartmentError,
    createDepartment,
    resetCreateDepartmentError,
    departments,
    loadingDepartments,
    fetchDepartments,
    
    // Category
    isCreateCategoryLoading,
    createCategoryError,
    createCategory,
    resetCreateCategoryError,
    categories,
    fetchCategories,
    
    // Subcategory
    isCreateSubcategoryLoading,
    createSubcategoryError,
    createSubcategory,
    resetCreateSubcategoryError,
  } = useAdmin();

  // Active tab state
  const [activeTab, setActiveTab] = useState<'department' | 'category' | 'subcategory'>('department');

  // Department form state
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCover, setDepartmentCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Category form state
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [categoryNames, setCategoryNames] = useState<string[]>(['']);

  // Subcategory form state
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [subcategoryNames, setSubcategoryNames] = useState<string[]>(['']);

  // Success states
  const [showDepartmentSuccess, setShowDepartmentSuccess] = useState(false);
  const [showCategorySuccess, setShowCategorySuccess] = useState(false);
  const [showSubcategorySuccess, setShowSubcategorySuccess] = useState(false);

  // Load departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Load categories when department is selected
  useEffect(() => {
    if (selectedDepartmentId) {
      fetchCategories(selectedDepartmentId);
    }
  }, [selectedDepartmentId]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDepartmentCover(file);
      const reader = new FileReader();
      reader.onload = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle department submission
  const handleDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDepartment({
        department_name: departmentName, 
        cover: departmentCover || undefined,
      });
      
      // Reset form
      setDepartmentName('');
      setDepartmentCover(null);
      setCoverPreview(null);
      setShowDepartmentSuccess(true);
      setTimeout(() => setShowDepartmentSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  // Handle category submission
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validNames = categoryNames.filter(name => name.trim() !== '');
    if (validNames.length === 0) return;

    try {
      await createCategory({
        department_id: selectedDepartmentId,
        category_name: validNames,
      });
      
      // Reset form
      setCategoryNames(['']);
      setShowCategorySuccess(true);
      setTimeout(() => setShowCategorySuccess(false), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  // Handle subcategory submission
  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validNames = subcategoryNames.filter(name => name.trim() !== '');
    if (validNames.length === 0) return;

    try {
      await createSubcategory({
        category_id: selectedCategoryId,
        subcategory_name: validNames,
      });
      
      // Reset form
      setSubcategoryNames(['']);
      setShowSubcategorySuccess(true);
      setTimeout(() => setShowSubcategorySuccess(false), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  // Add/remove category name fields
  const addCategoryField = () => setCategoryNames([...categoryNames, '']);
  const removeCategoryField = (index: number) => {
    if (categoryNames.length > 1) {
      setCategoryNames(categoryNames.filter((_, i) => i !== index));
    }
  };
  
  // Add/remove subcategory name fields
  const addSubcategoryField = () => setSubcategoryNames([...subcategoryNames, '']);
  const removeSubcategoryField = (index: number) => {
    if (subcategoryNames.length > 1) {
      setSubcategoryNames(subcategoryNames.filter((_, i) => i !== index));
    }
  };

  const tabs = [
    { id: 'department', label: 'Department', icon: Building2 },
    { id: 'category', label: 'Category', icon: Grid3X3 },
    { id: 'subcategory', label: 'Subcategory', icon: Layers3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Panel</h1>
          <p className="text-slate-600">Create and manage departments, categories, and subcategories</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Department Form */}
          {activeTab === 'department' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-800">Create Department</h2>
              </div>

              {/* Success Message */}
              {showDepartmentSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
                  <Check className="w-5 h-5" />
                  Department created successfully!
                </div>
              )}

              {/* Error Message */}
              {createDepartmentError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  {createDepartmentError}
                  <button
                    onClick={resetCreateDepartmentError}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleDepartmentSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., Men's Fashion, Women's Fashion, Kids"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cover Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 cursor-pointer transition-colors">
                      <Upload className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-600">Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {coverPreview && (
                      <div className="relative">
                        <img
                          src={coverPreview}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setDepartmentCover(null);
                            setCoverPreview(null);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreateDepartmentLoading || !departmentName.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreateDepartmentLoading ? 'Creating...' : 'Create Department'}
                </button>
              </form>
            </div>
          )}

          {/* Category Form */}
          {activeTab === 'category' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Grid3X3 className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-800">Create Category</h2>
              </div>

              {/* Success Message */}
              {showCategorySuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
                  <Check className="w-5 h-5" />
                  Category created successfully!
                </div>
              )}

              {/* Error Message */}
              {createCategoryError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  {createCategoryError}
                  <button
                    onClick={resetCreateCategoryError}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleCategorySubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Department
                  </label>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => setSelectedDepartmentId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Choose a department</option>
                    {departments.map((dept) => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                  {loadingDepartments && (
                    <p className="text-sm text-slate-500 mt-1">Loading departments...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category Names
                  </label>
                  <div className="space-y-3">
                    {categoryNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const newNames = [...categoryNames];
                            newNames[index] = e.target.value;
                            setCategoryNames(newNames);
                          }}
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="e.g., Clothing, Shoes, Accessories"
                        />
                        {categoryNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCategoryField(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCategoryField}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Another Category
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreateCategoryLoading || !selectedDepartmentId}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreateCategoryLoading ? 'Creating...' : 'Create Categories'}
                </button>
              </form>
            </div>
          )}

          {/* Subcategory Form */}
          {activeTab === 'subcategory' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Layers3 className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-800">Create Subcategory</h2>
              </div>

              {/* Success Message */}
              {showSubcategorySuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
                  <Check className="w-5 h-5" />
                  Subcategory created successfully!
                </div>
              )}

              {/* Error Message */}
              {createSubcategoryError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  {createSubcategoryError}
                  <button
                    onClick={resetCreateSubcategoryError}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubcategorySubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Department
                  </label>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => {
                      setSelectedDepartmentId(e.target.value);
                      setSelectedCategoryId(''); // Reset category selection
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Choose a department</option>
                    {departments.map((dept) => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Category
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={!selectedDepartmentId}
                  >
                    <option value="">Choose a category</option>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                  {!selectedDepartmentId && (
                    <p className="text-sm text-slate-500 mt-1">Please select a department first</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subcategory Names
                  </label>
                  <div className="space-y-3">
                    {subcategoryNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const newNames = [...subcategoryNames];
                            newNames[index] = e.target.value;
                            setSubcategoryNames(newNames);
                          }}
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="e.g., Sneakers, Boots, Sandals"
                        />
                        {subcategoryNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubcategoryField(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSubcategoryField}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Another Subcategory
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreateSubcategoryLoading || !selectedCategoryId}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreateSubcategoryLoading ? 'Creating...' : 'Create Subcategories'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogPanel;