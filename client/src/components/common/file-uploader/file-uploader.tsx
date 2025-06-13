import  { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileWithPath } from 'react-dropzone';

type FileUploaderProps = {
    fieldChange: (FILES: File[]) => void,
    mediaUrl: string,
}

const FileUploader = ({ fieldChange, mediaUrl }: FileUploaderProps) => {

    const [fileUrl, setFileUrl] = useState<string> (mediaUrl);
    const [file, setFile] = useState<File[]>([])

    const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
        setFile(acceptedFiles);
        fieldChange(acceptedFiles);
        setFileUrl(URL.createObjectURL(acceptedFiles[0]))
        
      }, [file])
      const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']
        }
    })
    
  return (
    <div {...getRootProps()} className='flex flex-center flex-col bg-[#eaeaeada] rounded-xl cursor-pointer'>
    <input {...getInputProps()} className='curser-pointer bg-[#eaeaeada] text-[#131313]' />
    {
      fileUrl ? ( 
        <> 
        <div className='flex flex-1 justify-center w-full p-5 lg:p-10'>
            <picture>
                <source srcSet={fileUrl} type="image/webp" />
                <img src={fileUrl} alt='uploaded image' className='file_uploader-img' loading="lazy" />
            </picture>
         </div> 
         <p className='file_uploader-label'>
            Click or drag photo to replace
         </p>
        </>
     
      ): (
      <div className='file_uploader-box'>
            <img src="/assets/icons/file-upload.svg" alt="File upload" width={96} height={77} loading="lazy" />
            <h3 className='base-medium text-[#aaa] mb-2 mt-6'>
                Drag photo here or click to upload
            </h3>
            <p className='text-light-4 small-regular mb-6'>
                SVG, PNG, JPG,JPEG
            </p>
           
      </div>
      )
      
    }
  </div>
  )
}

export default FileUploader