import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, CheckCircle, Trash } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

const CreateBatch = () => {
    const { recipeId, batchId } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!batchId;

    const [formData, setFormData] = useState({
        recipe_id: recipeId ? parseInt(recipeId) : null,
        made_date: new Date().toISOString().split('T')[0],
        fridge_date: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [initialImage, setInitialImage] = useState(null);
    const [existingImages, setExistingImages] = useState([]);

    const [recipeName, setRecipeName] = useState('');

    useEffect(() => {
        const fetchRecipeName = async (rId) => {
            if (!rId) return;
            try {
                const response = await api.get(`/recipes/${rId}`);
                setRecipeName(response.data.name);
            } catch (error) {
                console.error("Failed to fetch recipe name", error);
            }
        };

        if (isEditMode) {
            const fetchBatch = async () => {
                try {
                    const response = await api.get(`/batches/${batchId}`);
                    setFormData({
                        recipe_id: response.data.recipe_id,
                        made_date: response.data.made_date,
                        fridge_date: response.data.fridge_date,
                        notes: response.data.notes,
                    });
                    setExistingImages(response.data.images || []);
                    fetchRecipeName(response.data.recipe_id);
                } catch (error) {
                    console.error("Failed to fetch batch", error);
                }
            };
            fetchBatch();
        } else if (recipeId) {
            fetchRecipeName(recipeId);
        }
    }, [batchId, recipeId, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Convert empty string fridge_date to null
            const payload = {
                ...formData,
                fridge_date: formData.fridge_date === '' ? null : formData.fridge_date
            };

            if (isEditMode) {
                await api.patch(`/batches/${batchId}`, payload);
                // If adding image in edit mode, logic might be different or usually just use Detail view.
                // But if they uploaded one here:
                if (initialImage) {
                    await api.post(`/batches/${batchId}/images/`, { image_url: initialImage });
                }
                navigate(`/manager/batches/${batchId}`);
            } else {
                const res = await api.post('/batches/', payload);
                const newBatchId = res.data.id;
                if (initialImage) {
                    await api.post(`/batches/${newBatchId}/images/`, { image_url: initialImage });
                }
                navigate(`/manager/recipes/${recipeId}`);
            }
        } catch (error) {
            console.error("Failed to save batch", error);
            alert("Failed to save batch. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center space-x-4">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Batch' : 'Log New Batch'}</h1>
                    {recipeName && <p className="text-gray-500 text-sm">for {recipeName}</p>}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Made</label>
                        <input
                            type="date"
                            required
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pickle-green-500 focus:border-transparent outline-none transition"
                            value={formData.made_date}
                            onChange={(e) => setFormData({ ...formData, made_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fridge Date (Optional)</label>
                        <input
                            type="date"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pickle-green-500 focus:border-transparent outline-none transition"
                            value={formData.fridge_date || ''}
                            onChange={(e) => setFormData({ ...formData, fridge_date: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Production Notes (Optional)</label>
                    <textarea
                        rows={4}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pickle-green-500 focus:border-transparent outline-none transition"
                        placeholder="Observations, changes made, etc."
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Photos</label>

                    {/* Existing Images Grid */}
                    {existingImages.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                            {existingImages.map((img) => (
                                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={img.image_url} alt="Batch" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!window.confirm("Delete this image?")) return;
                                            try {
                                                await api.delete(`/batch-images/${img.id}`);
                                                setExistingImages(prev => prev.filter(i => i.id !== img.id));
                                            } catch (err) { console.error("Failed to delete image", err); }
                                        }}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
                        <ImageUpload
                            label={existingImages.length > 0 ? "Add Another Photo" : "Add Batch Photo (Optional)"}
                            onUploadSuccess={isEditMode ? async (url) => {
                                // If in edit mode, upload immediately triggers a save/link
                                try {
                                    const res = await api.post(`/batches/${batchId}/images/`, { image_url: url });
                                    setExistingImages(prev => [...prev, res.data]);
                                    // We don't need 'initialImage' state in edit mode if we auto-save
                                } catch (e) { console.error("Failed to link image", e); }
                            } : setInitialImage}
                            autoClear={isEditMode}
                        />
                        {/* Show preview for initialImage in create mode only if ImageUpload doesn't handle preview persistence (it handles its own preview, but we might want to show it here if we wanted to be fancy. For now, ImageUpload's internal preview is fine for the 'pending' upload). 
                             Actually, ImageUpload clears itself on success if autoClear is true. 
                             In Create Mode, autoClear is false (default), so ImageUpload shows the preview.
                             In Edit Mode, autoClear is true, so we clear it and show it in the grid.
                         */}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 bg-pickle-green-600 text-white py-3 rounded-lg font-semibold hover:bg-pickle-green-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <CheckCircle size={20} />
                    <span>{loading ? 'Saving...' : (isEditMode ? 'Update Batch' : 'Log Batch')}</span>
                </button>
            </form>
        </div>
    );
};

export default CreateBatch;
