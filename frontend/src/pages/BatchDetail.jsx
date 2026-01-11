import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Calendar, Star, ChefHat, Edit, Utensils } from 'lucide-react';

const BatchDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recipe, setRecipe] = useState(null);

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
            <Link to="/" className="text-pickle-green-600 hover:underline">Return Home</Link>
        </div>
    );

    return (
        <div>
            <div className="mb-4">
                <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                    <ArrowLeft size={20} />
                    <span>Back to Home</span>
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

                <div className="border-t border-gray-100 py-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Utensils size={18} className="mr-2 text-pickle-green-600" />
                        Tasting Log
                    </h2>

                    {/* List of existing notes */}
                    {batch.tasting_notes && batch.tasting_notes.length > 0 ? (
                        <div className="space-y-4 mb-6">
                            {batch.tasting_notes.map((note) => (
                                <div key={note.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-semibold text-gray-800 mr-2">{note.reviewer_name}</span>
                                            <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill={i < note.rating ? "currentColor" : "none"} className={i < note.rating ? "" : "text-gray-300"} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-700 italic">"{note.note}"</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic mb-6">No tasting notes recorded yet.</p>
                    )}

                    {/* Add new note form */}
                    <div className="bg-white p-4 rounded-lg border border-pickle-green-100">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Review</h3>
                        <TastingNoteForm batchId={batch.id} onNoteAdded={(newNote) => {
                            setBatch(prev => ({ ...prev, tasting_notes: [...prev.tasting_notes, newNote] }));
                        }} />
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <Link
                        to={`/batches/${id}/edit`}
                        className="flex items-center space-x-2 text-gray-500 hover:text-pickle-green-600 font-semibold"
                    >
                        <Edit size={20} />
                        <span>Edit Batch</span>
                    </Link>

                    <Link
                        to={`/recipes/${batch.recipe_id}`}
                        className="flex items-center space-x-2 text-pickle-green-600 font-semibold hover:text-pickle-green-700 hover:underline"
                    >
                        <ChefHat size={20} />
                        <span>View Recipe</span>
                    </Link>
                </div>

            </div>
        </div>
    );
};

const TastingNoteForm = ({ batchId, onNoteAdded }) => {
    const [name, setName] = useState("Maker");
    const [rating, setRating] = useState(0);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post(`/batches/${batchId}/tasting-notes/`, {
                reviewer_name: name,
                rating,
                note
            });
            onNoteAdded(res.data);
            setNote("");
            setRating(0);
        } catch (error) {
            console.error("Failed to add note", error);
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
                required
            />
            <button
                type="submit"
                disabled={submitting}
                className="bg-pickle-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-pickle-green-700 disabled:opacity-50"
            >
                {submitting ? "Adding..." : "Add Review"}
            </button>
        </form>
    );
};

export default BatchDetail;
