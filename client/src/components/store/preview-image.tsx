import imageIcon from '@assets/icons/image.png';
import { useState } from 'react';

interface PreviewImageInterface {
    index?: number;
    onImageChange?: (file: File | null) => void;
}

const PreviewImage: React.FC<PreviewImageInterface> = ({ index, onImageChange }) => {
    const [preview, setPreview] = useState<string>();
    const [, setCurrentFile] = useState<File | null>(null); //currentFile removed 

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        
        if (file) {

            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }
                        const maxSize = 20 * 1024 * 1024; // 20MB
            if (file.size > maxSize) {
                alert('Image size must be less than 20MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
            
            setCurrentFile(file);
            onImageChange?.(file);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setPreview(undefined);
        setCurrentFile(null);
        onImageChange?.(null);
        
        const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
        if (input) input.value = '';
    };

    return (
        <label className="w-[150px] h-[150px] overflow-hidden relative border border-solid border-[#ddd] flex flex-col gap-2 items-center justify-center cursor-pointer hover:border-[#bbb] group">
            <input 
                accept="image/*" 
                type='file' 
                className='hidden' 
                onChange={handleChange} 
            />
            
            {preview ? (
                <>
                    <img 
                        src={preview} 
                        alt="Image upload" 
                        className='w-full h-full object-cover' 
                    />
                    {/* Remove button */}
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Remove image"
                    >
                        ×
                    </button>
                </>
            ) : (
                <>
                    <img 
                        src={imageIcon} 
                        alt="Image upload" 
                        className='w-[25px] h-auto' 
                    />
                    <p className='text-[12px] text-center px-2'>
                        + Add Image
                        {index === 0 && <span className="text-[#ff0000]">*</span>}
                    </p>
                </>
            )}
        </label>
    );
};

export default PreviewImage;