import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { FileWithPath } from 'react-dropzone';
import { Upload, Image, Check, X } from 'lucide-react';

type FileUploaderProps = {
    fieldChange: (FILES: File[]) => void,
    mediaUrl: string,
}

const FileUploader = ({ fieldChange, mediaUrl }: FileUploaderProps) => {
    const [fileUrl, setFileUrl] = useState<string>(mediaUrl);
    const [file, setFile] = useState<File[]>([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
        setFile(acceptedFiles);
        fieldChange(acceptedFiles);
        setFileUrl(URL.createObjectURL(acceptedFiles[0]));
        
        // Simulate upload progress for better UX
        setIsUploading(true);
        setUploadProgress(0);
        
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    setIsUploading(false);
                    return 100;
                }
                return prev + 10;
            });
        }, 100);
        
    }, [fieldChange]);

    const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']
        },
        onDragEnter: () => setIsDragActive(true),
        onDragLeave: () => setIsDragActive(false),
        maxFiles: 1,
        multiple: false
    });

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile([]);
        setFileUrl('');
        fieldChange([]);
        setUploadProgress(0);
    };

    return (
        <div className="w-full h-full">
            <div 
                {...getRootProps()} 
                className={`
                    relative flex flex-col items-center justify-center 
                    w-full h-full rounded-2xl border-2 border-dashed 
                    transition-all duration-300 ease-in-out cursor-pointer
                    overflow-hidden group
                    ${isDragActive || dropzoneActive 
                        ? 'border-blue-400 bg-blue-50 scale-[1.02]' 
                        : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-gray-400 hover:bg-gray-100'
                    }
                `}
            >
                <input {...getInputProps()} />
                
                {fileUrl ? (
                    <div className="relative w-full h-full flex flex-col">
                        {/* Image Preview */}
                        <div className="flex-1 relative overflow-hidden rounded-t-2xl">
                            <img 
                                src={fileUrl} 
                                alt="Uploaded preview" 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                                    <Upload size={32} className="mx-auto mb-2" />
                                    <p className="text-sm font-medium">Click to replace</p>
                                </div>
                            </div>

                            {/* Remove button */}
                            <button
                                onClick={removeFile}
                                className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full 
                                         flex items-center justify-center opacity-0 group-hover:opacity-100 
                                         transition-all duration-300 hover:bg-red-600 hover:scale-110 shadow-lg"
                                aria-label="Remove image"
                            >
                                <X size={16} />
                            </button>

                            {/* Upload progress */}
                            {isUploading && (
                                <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-1">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* File info footer */}
                        <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Check size={16} className="text-green-500" />
                                    <span className="text-sm font-medium text-gray-700">Image ready</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {file[0]?.name || 'profile-image.jpg'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 space-y-4">
                        {/* Upload icon with animation */}
                        <div className={`
                            mx-auto w-16 h-16 rounded-full flex items-center justify-center
                            transition-all duration-300
                            ${isDragActive || dropzoneActive 
                                ? 'bg-blue-100 text-blue-600 scale-110' 
                                : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600'
                            }
                        `}>
                            <Image size={24} className={isDragActive ? 'animate-bounce' : ''} />
                        </div>

                        {/* Text content */}
                        <div className="space-y-2">
                            <h3 className={`
                                text-lg font-semibold transition-colors duration-300
                                ${isDragActive || dropzoneActive ? 'text-blue-700' : 'text-gray-700'}
                            `}>
                                {isDragActive ? 'Drop your image here' : 'Upload profile picture'}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                Drag and drop your image here, or click to browse files
                            </p>
                        </div>

                        {/* Supported formats */}
                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                            {['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG'].map((format) => (
                                <span 
                                    key={format}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium"
                                >
                                    {format}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Drag active overlay */}
                {(isDragActive || dropzoneActive) && !fileUrl && (
                    <div className="absolute inset-0 bg-blue-50 bg-opacity-80 flex items-center justify-center rounded-2xl">
                        <div className="text-center">
                            <Upload size={32} className="mx-auto text-blue-600 animate-bounce mb-2" />
                            <p className="text-blue-700 font-medium">Release to upload</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploader;