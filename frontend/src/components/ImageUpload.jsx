import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import axios from 'axios';
import api from '../api';

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

        try {
            const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;

            // 1. Get Signature from Backend
            const sigRes = await api.get('/signature', {
                params: { upload_preset: preset }
            });
            const { signature, timestamp } = sigRes.data;

            // 2. Upload to Cloudinary with Signature
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', preset);
            formData.append('timestamp', timestamp);
            formData.append('signature', signature);
            formData.append('api_key', apiKey);

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
            if (error.response?.status === 401) {
                // Auth error handled by interceptor, but we still need to stop loading
                // User will see login modal
            } else {
                alert("Failed to upload image. ensure you are logged in and have API Key configured.");
            }
            // Keep preview if it was just an auth error so they can see what they tried to upload?
            // Actually better to reset or they might think it worked. 
            // But if they login, they might want to retry.
            // Let's keep preview but maybe show error state? Simpler to just reset for now or keep it.
            // I'll leave the preview there so they know "oh I was trying to upload this". 
            // But 'uploading' is false.
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
