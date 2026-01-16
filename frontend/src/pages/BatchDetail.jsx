import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Calendar, Star, ChefHat, Edit, Utensils, Camera, Plus, Trash, X } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

const BatchDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recipe, setRecipe] = useState(null);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const [editingNoteId, setEditingNoteId] = useState(null);

    useEffect(() => {
        const fetchBatchAndRecipe = async () => {
            try {
                const batchRes = await api.get(`/batches/${id}`);
                setBatch(batchRes.data);

                // Fetch recipe details
                const recipeRes = await api.get(`/recipes/${batchRes.data.recipe_id}`);
                setRecipe(recipeRes.data);
            } catch (err) {
                setError("Batch or Recipe not found.");
            } finally {
                setLoading(false);
            }
        };
        fetchBatchAndRecipe();
    }, [id]);

    if (loading) return <div className="text-center py-10">Loading...</div>;

    if (error) return (
        <div className="text-center py-10">
            <div className="text-red-500 mb-4">{error}</div>
            <Link to="/manager" className="text-pickle-green-600 hover:underline">Return Home</Link>
        </div>
    );

    return (
        <div>
            <div className="mb-4">
                <button onClick={() => navigate('/manager')} className="text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                    <ArrowLeft size={20} />
                    <span>Back to Manager</span>
                </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <span className="bg-pickle-green-100 text-pickle-green-800 px-3 py-1 rounded-lg font-mono">#{batch.id}</span>
                            </h1>
                            {recipe && (
                                <span className="text-xl text-gray-600 font-medium">
                                    for {recipe.name}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 flex items-center mt-2 group relative">
                            <span className="flex items-center">
                                <Calendar size={18} className="mr-1" />
                                Made on {batch.made_date}
                            </span>
                            {batch.fridge_date && (
                                <span className="flex items-center ml-4">
                                    <span className="w-1 h-1 bg-gray-300 rounded-full mx-2"></span>
                                    In Fridge: {batch.fridge_date}
                                    <span className="ml-2 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                        {Math.max(0, Math.ceil((new Date(batch.fridge_date) - new Date(batch.made_date)) / (1000 * 60 * 60 * 24)))} days
                                    </span>
                                </span>
                            )}
                        </p>
                    </div>

                </div>

                <div className="border-t border-gray-100 py-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Production Notes</h2>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg italic">
                        {batch.notes || "No production notes recorded."}
                    </p>
                </div>

                {/* Batch Images Gallery */}
                <div className="border-t border-gray-100 py-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <Camera size={18} className="mr-2 text-pickle-green-600" />
                        Media Gallery
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        {batch.images && batch.images.map((img) => (
                            <div
                                key={img.id}
                                className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 group cursor-pointer"
                                onClick={() => setFullScreenImage(img.image_url)}
                            >
                                <img src={img.image_url} alt="Batch" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (!window.confirm("Delete this image?")) return;
                                        try {
                                            await api.delete(`/batch-images/${img.id}`);
                                            setBatch(prev => ({ ...prev, images: prev.images.filter(i => i.id !== img.id) }));
                                        } catch (err) { console.error("Failed to delete", err); }
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow"
                                >
                                    <Trash size={14} />
                                </button>
                            </div>
                        ))}
                        {/* Inline Upload for Batch */}
                        <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                            <div className="scale-75 origin-center">
                                <ImageUpload label="" autoClear={true} onUploadSuccess={async (url) => {
                                    if (url) {
                                        try {
                                            const res = await api.post(`/batches/${id}/images/`, { image_url: url });
                                            setBatch(prev => ({ ...prev, images: [...(prev.images || []), res.data] }));
                                        } catch (e) { console.error("Failed to link image", e); }
                                    }
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 py-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Utensils size={18} className="mr-2 text-pickle-green-600" />
                        Tasting Log
                    </h2>

                    {/* List of existing notes */}
                    {batch.tasting_notes && batch.tasting_notes.length > 0 ? (
                        <div className="space-y-4 mb-6">
                            {batch.tasting_notes.map((note) => (
                                <div key={note.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative group">
                                    {editingNoteId === note.id ? (
                                        <TastingNoteForm
                                            initialData={note}
                                            submitLabel="Save Changes"
                                            onSubmit={async (data) => {
                                                const res = await api.patch(`/tasting-notes/${note.id}`, data);
                                                setBatch(prev => ({
                                                    ...prev,
                                                    tasting_notes: prev.tasting_notes.map(n => n.id === note.id ? res.data : n)
                                                }));
                                                setEditingNoteId(null);
                                            }}
                                            onCancel={() => setEditingNoteId(null)}
                                        />
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-semibold text-gray-800 mr-2">{note.reviewer_name}</span>
                                                    <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={14} fill={i < note.rating ? "currentColor" : "none"} className={i < note.rating ? "" : "text-gray-300"} />
                                                        ))}
                                                    </div>
                                                    {/* Edit/Delete Actions */}
                                                    <div className="hidden group-hover:flex items-center gap-1">
                                                        <button
                                                            onClick={() => setEditingNoteId(note.id)}
                                                            className="text-gray-400 hover:text-blue-500 p-1"
                                                            title="Edit Note"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!window.confirm("Delete this review?")) return;
                                                                try {
                                                                    await api.delete(`/tasting-notes/${note.id}`);
                                                                    setBatch(prev => ({
                                                                        ...prev,
                                                                        tasting_notes: prev.tasting_notes.filter(n => n.id !== note.id)
                                                                    }));
                                                                } catch (e) { console.error("Failed to delete", e); }
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 p-1"
                                                            title="Delete Note"
                                                        >
                                                            <Trash size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 italic">"{note.note}"</p>
                                            {note.image_url && (
                                                <div
                                                    className="mt-3 relative w-32 aspect-square rounded-lg overflow-hidden border border-gray-100 group cursor-pointer shadow-sm"
                                                    onClick={() => setFullScreenImage(note.image_url)}
                                                >
                                                    <img src={note.image_url} alt="Tasting Note" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic mb-6">No tasting notes recorded yet.</p>
                    )}

                    {/* Add new note form */}
                    <div className="bg-white p-4 rounded-lg border border-pickle-green-100">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Review</h3>
                        <TastingNoteForm
                            submitLabel="Add Review"
                            onSubmit={async (data) => {
                                const res = await api.post(`/batches/${batch.id}/tasting-notes/`, data);
                                setBatch(prev => ({ ...prev, tasting_notes: [...prev.tasting_notes, res.data] }));
                            }}
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <div className="flex space-x-4">
                        <Link
                            to={`/manager/batches/${id}/edit`}
                            className="flex items-center space-x-2 text-gray-500 hover:text-pickle-green-600 font-semibold transition"
                        >
                            <Edit size={20} />
                            <span>Edit Batch</span>
                        </Link>

                        <div className="w-px h-6 bg-gray-300"></div>

                        <button
                            onClick={async () => {
                                if (!window.confirm("Are you sure you want to delete this batch? All images and tasting notes will be removed.")) return;
                                try {
                                    await api.delete(`/batches/${id}`);
                                    navigate(`/manager/recipes/${batch.recipe_id}`);
                                } catch (e) { console.error("Failed to delete batch", e); }
                            }}
                            className="flex items-center space-x-2 text-red-400 hover:text-red-500 font-semibold transition"
                        >
                            <Trash size={20} />
                            <span>Delete Batch</span>
                        </button>
                    </div>

                    <Link
                        to={`/manager/recipes/${batch.recipe_id}`}
                        className="flex items-center space-x-2 text-pickle-green-600 font-semibold hover:text-pickle-green-700 hover:underline"
                    >
                        <ChefHat size={20} />
                        <span>View Recipe</span>
                    </Link>
                </div>

            </div>

            {/* Lightbox Modal */}
            {
                fullScreenImage && (
                    <div
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setFullScreenImage(null)}
                    >
                        <button
                            onClick={() => setFullScreenImage(null)}
                            className="absolute top-4 right-4 text-white/70 hover:text-white transition"
                        >
                            <X size={32} />
                        </button>
                        <img
                            src={fullScreenImage}
                            alt="Full Screen"
                            className="max-w-full max-h-screen object-contain shadow-2xl rounded-sm"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )
            }
        </div >
    );
};

const TastingNoteForm = ({ initialData = {}, onSubmit, onCancel, submitLabel = "Submit" }) => {
    const [name, setName] = useState(initialData.reviewer_name || "PJ");
    const [rating, setRating] = useState(initialData.rating || 0);
    const [note, setNote] = useState(initialData.note || "");
    const [imageUrl, setImageUrl] = useState(initialData.image_url || null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit({
                reviewer_name: name,
                rating,
                note,
                image_url: imageUrl
            });
            // Reset only if creating new (no ID)
            if (!initialData.id) {
                setNote("");
                setRating(0);
                setImageUrl(null);
            }
        } catch (error) {
            console.error("Failed to add/update note", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-4">
                <div className="w-1/3">
                    <input
                        type="text"
                        placeholder="Your Name"
                        className="w-full p-2 text-sm border border-gray-200 rounded-md"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="flex-1 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                            <Star size={20} fill={star <= rating ? "gold" : "none"} className={star <= rating ? "text-yellow-400" : "text-gray-300"} />
                        </button>
                    ))}
                </div>
            </div>
            <textarea
                className="w-full p-2 text-sm border border-gray-200 rounded-md"
                placeholder="What do you think?"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />

            <div className="bg-gray-50 p-2 rounded-lg">
                {imageUrl && (
                    <div className="mb-2 relative w-20 aspect-square group">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md border border-gray-200" />
                        <button
                            type="button"
                            onClick={() => setImageUrl(null)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition"
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}
                <ImageUpload label={imageUrl ? "Change Photo" : "Add Photo (Optional)"} onUploadSuccess={setImageUrl} autoClear={true} />
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-gray-500 text-sm px-3 py-2 hover:bg-gray-100 rounded-md"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-pickle-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-pickle-green-700 disabled:opacity-50"
                >
                    {submitting ? "Saving..." : submitLabel}
                </button>
            </div>
        </form>
    );
};

export default BatchDetail;
