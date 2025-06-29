import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ISearchableSelect {
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  bgLight?: boolean;
  className?: string;
  width?: number;
  height?: number;
  icon?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: any) => any;
  searchPlaceholder?: string;
  noOptionsText?: string;
}

export const SearchableSelect: React.FC<ISearchableSelect> = ({
  options = [],
  placeholder = "Select an option",
  disabled = false,
  className = "",
  width,
  height,
  icon,
  value,
  defaultValue,
  onChange,
  bgLight,
  searchPlaceholder = "Search options...",
  noOptionsText = "No options found"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || "");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === selectedValue);
  const selectedLabel = selectedOption ? selectedOption.label : "";

  const calculateDropdownPosition = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 280;
    
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      calculateDropdownPosition();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            handleSelect(filteredOptions[focusedIndex].value);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm("");
          setFocusedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, filteredOptions]);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    setSearchTerm("");
    setFocusedIndex(-1);
    onChange?.(optionValue);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearchTerm("");
    setFocusedIndex(-1);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width: width ? `${width}px` : '450px' }}
    >
      {/* Main Select Button */}
      <div
        onClick={toggleDropdown}
        className={`
          ${width ? `w-[${width}px]` : "w-[450px]"} 
          ${height ? `h-[${height}px]` : "h-[40px]"} 
          bg-[#3b3b3b] text-[#fff] flex items-center justify-between gap-3 py-2 px-4 rounded-3xl
          cursor-pointer transition-all duration-200 ease-in-out
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#454545]'}
          ${isOpen ? 'ring-2 ring-blue-500/30 bg-[#454545]' : ''}
          ${bgLight ? '!bg-primary-light !text-primary-dark' : ''}
        `}
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          {icon && <img src={icon} alt="Icon" className="flex-shrink-0" />}
          <div className={`
            text-[12px] 
            ${selectedLabel ? 'text-[#fff]' : 'text-[#8e8e8e] font-[400]'}
            ${bgLight ? '!text-primary-dark': ''}
          `}>
            {selectedLabel || placeholder}
          </div>
        </div>
        
        <ChevronDown 
          size={14} 
          className={`
            text-[#8e8e8e] transition-transform duration-200 ease-in-out flex-shrink-0
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}
        />
      </div>

      {/* Dropdown */}
      <div className={`
        absolute left-0 right-0 z-50
        ${dropdownPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}
        transform transition-all duration-200 ease-in-out
        ${dropdownPosition === 'bottom' ? 'origin-top' : 'origin-bottom'}
        ${isOpen 
          ? 'opacity-100 scale-100 translate-y-0' 
          : `opacity-0 scale-95 pointer-events-none ${
              dropdownPosition === 'bottom' ? '-translate-y-2' : 'translate-y-2'
            }`
        }
      `}>
        <div className={`bg-[#3b3b3b] rounded-2xl shadow-2xl border border-[#555] overflow-hidden ${bgLight ? '!bg-primary-light !text-primary-dark' : ''}`}>
          {/* Search Input */}
          <div className="p-3 border-b border-[#555]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8e8e8e]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFocusedIndex(-1);
                }}
                placeholder={searchPlaceholder}
                className={`w-full bg-[#2a2a2a] text-[#fff] text-[12px] pl-9 pr-3 py-2 rounded-xl
                  placeholder:text-[#8e8e8e] placeholder:font-[400] outline-none
                  focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 ${bgLight ? '!bg-[#bbb] !text-primary-dark':''}`}
              />
            </div>
          </div>

          {/* Options List */}
          <div 
            ref={dropdownRef}
            className="max-h-60 overflow-y-auto custom-scrollbar"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={`
                    flex items-center justify-between px-4 py-3 text-[12px] cursor-pointer
                    transition-all duration-150 ease-in-out
                    ${option.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : `hover:bg-[#454545] ${bgLight ? 'hover:!bg-[#aaa]': ''}`
                    }
                    ${focusedIndex === index ? `bg-[#454545] ${bgLight ? 'bg-[#aaa]':''}` : ''}
                    ${selectedValue === option.value ? 'bg-blue-500/10 text-blue-400' : 'text-[#fff]'}
                    ${bgLight ? '!text-primary-dark': ''}
                  `}
                >
                  {option.label}
                  {selectedValue === option.value && (
                    <Check size={14} className="text-blue-400 flex-shrink-0 ml-2" />
                  )}
                </div>
              ))
            ) : (
              <div className={`px-4 py-6 text-center text-[#fff] text-[12px] ${bgLight ? '!text-primary-dark': ''}`}>
                {noOptionsText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};