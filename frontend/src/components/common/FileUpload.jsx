import React, { useCallback, useState } from 'react';

import { useDropzone } from 'react-dropzone';
import { HiOutlineUpload, HiOutlineX, HiOutlineDocument } from 'react-icons/hi';

import Button from './Button';

export default function FileUpload({
  onUpload,
  accept = { 'image/*': [], 'application/pdf': [] },
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
}) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      setError('Some files were rejected. Please check file type and size.');
      return;
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      progress: 0,
    }));

    setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles);
  }, [multiple]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
  });

  const removeFile = (id) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (!multiple) return [];
      return filtered;
    });
  };

  const uploadFiles = async () => {
    const formData = new FormData();
    files.forEach(({ file }) => {
      formData.append('files', file);
    });

    try {
      setFiles(prev => prev.map(f => ({ ...f, progress: 0 })));
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setFiles(prev => prev.map(f => ({ ...f, progress: i })));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await onUpload(formData);
      setFiles([]);
    } catch (_err) {
      setError('Upload failed. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <HiOutlineUpload className="w-8 h-8 text-primary-600" />
          </div>
          <p className="text-gray-700 font-medium">
            {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-xs text-gray-400">
            Supported files: Images, PDF (Max size: {maxSize / 1024 / 1024}MB)
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Files to upload ({files.length})
            </h4>
            <Button variant="success" size="sm" onClick={uploadFiles}>
              Upload All
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm"
              >
                {/* Preview */}
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HiOutlineDocument className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                {/* Progress */}
                {file.progress > 0 && file.progress < 100 && (
                  <div className="w-16">
                    <div className="text-xs text-primary-600 font-medium text-right">
                      {file.progress}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-primary-600 rounded-full h-1 transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <HiOutlineX className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
