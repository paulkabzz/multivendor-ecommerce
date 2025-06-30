import type { IShoppingCard } from "@utils/types";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Eye } from 'lucide-react';

export const ShoppingCard: React.FC<Partial<IShoppingCard & {images: any[]}>> = ({ 
  name, 
  price, 
  img_url, 
  images = [],
}) => {
  // Prepare images array - handle both single img_url and images array
  const allImages = images && images.length > 0 
    ? images.map(img => img.image_url || img) 
    : img_url 
      ? [img_url] 
      : [];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const nextImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }
  };

  const prevImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  const goToImage = (index: any) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="group rounded-2xl transition-all duration-300 overflow-hidden w-full max-w-sm">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {/* Main Image */}
        {allImages.length > 0 ? (
          <img
            src={allImages[currentImageIndex]}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e: any) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
        
        {/* Image Navigation - Only show if multiple images */}
        {allImages.length > 1 && (
          <>
            {/* Navigation Arrows */}
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            >
              <ChevronRight size={16} />
            </button>
            
            {/* Image Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-white scale-110 shadow-lg' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full shadow-lg transition-all duration-200 ${
              isLiked 
                ? 'bg-red-500 text-white scale-110' 
                : 'bg-white/80 hover:bg-white text-gray-700 hover:scale-105'
            }`}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button className="p-2 bg-white/80 hover:bg-white text-gray-700 rounded-full shadow-lg transition-all duration-200 hover:scale-105">
            <Eye size={16} />
          </button>
        </div>

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
            {currentImageIndex + 1}/{allImages.length}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 mt-2 flex justify-between items-center">
        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight hover:text-blue-600 transition-colors cursor-pointer">
          {name}
        </h3>

        {/* Price */}
          <p className="font-bold text-[12px]">
          R{typeof price === 'number' ? price.toFixed(2) : price}
          </p>

      </div>

    </div>
  );
};