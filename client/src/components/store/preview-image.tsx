import imageIcom from '@assets/icons/image.png';
import { useState } from 'react';

interface PreviewImageInterface {
    image?: string;
}

const PreviewImage: React.FC<PreviewImageInterface> = () => {
    const [preview, setPreview] = useState<string>();

    const handleChane = (e: React.ChangeEvent<HTMLInputElement>) => {

        const file = e.target.files?.[0];
        if (file) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
        }
    }
  return (
    <label className="w-[150px] h-[150px] overflow-hidden relative border border-solid flex flex-col gap-2 items-center justify-center cursor-pointer">
        <input accept="image/*" type='file' className='hidden' onChange={handleChane} />
        { 
            preview ? <img src={preview} alt="Image upload" className='w-full h-full object-cover' /> :  <img src={imageIcom} alt="Image upload" className='w-[25px] h-auto' /> 
        }
        {
            !preview && <p className='text-[12px]'>+ Add Image</p>
        }
    </label>
  )
}

export default PreviewImage;