import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import axios from 'axios';

const ImageUpload = ({ onUploadSuccess, label = "Add Photo", autoClear = false }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show local preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                formData
            );

            setUploading(false);
            if (onUploadSuccess) {
                onUploadSuccess(res.data.secure_url);
            }
            if (autoClear) {
                setPreview(null);
            }
        } catch (error) {
            console.error("Upload failed", error);
            setUploading(false);
            alert("Failed to upload image. Check console.");
            setPreview(null);
        }
    };

    const clearImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setPreview(null);
        if (onUploadSuccess) onUploadSuccess(null);
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

            {preview ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="text-white animate-spin" />
                        </div>
                    )}
                    {!uploading && (
                        <button
                            onClick={clearImage}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            ) : (
                <label className="flex items-center justify-center w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition border-dashed">
                    <ImageIcon size={20} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Upload Image</span>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </label>
            )}
        </div>
    );
};

export default ImageUpload;
