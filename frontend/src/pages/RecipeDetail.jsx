import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Plus, Calendar, Star, Edit, Clock } from 'lucide-react';

const RecipeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [recipeRes, batchesRes] = await Promise.all([
                    api.get(`/recipes/${id}`),
                    api.get(`/recipes/${id}/batches`)
                ]);
                setRecipe(recipeRes.data);
                setBatches(batchesRes.data);
            } catch (error) {
                console.error("Failed to fetch details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="text-center py-10">Loading...</div>;
    if (!recipe) return <div className="text-center py-10">Recipe not found</div>;

    return (
        <div>
            <div className="mb-4">
                <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                    <ArrowLeft size={20} />
                    <span>Back to Recipes</span>
                </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">{recipe.name}</h1>
                    <Link
                        to={`/recipes/${id}/edit`}
                        className="text-gray-500 hover:text-pickle-green-600 transition"
                    >
                        <Edit size={24} />
                    </Link>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center">
                        <Clock size={16} className="mr-1" />
                        <span>Added: {new Date(recipe.created_at).toLocaleDateString()}</span>
                    </div>
                    {recipe.updated_at && recipe.updated_at !== recipe.created_at && (
                        <div className="flex items-center">
                            <Clock size={16} className="mr-1" />
                            <span>Updated: {new Date(recipe.updated_at).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Ingredients</h3>
                        <p className="whitespace-pre-line text-gray-800">{recipe.ingredients}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Instructions</h3>
                        <p className="whitespace-pre-line text-gray-800">{recipe.instructions}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Batches</h2>
                <Link
                    to={`/recipes/${id}/new-batch`}
                    className="flex items-center space-x-2 bg-pickle-green-600 text-white px-4 py-2 rounded-lg hover:bg-pickle-green-700 transition shadow-sm"
                >
                    <Plus size={20} />
                    <span>Log Batch</span>
                </Link>
            </div>

            {batches.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No batches logged for this recipe yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {batches.map((batch) => (
                        <Link
                            to={`/batches/${batch.id}`}
                            key={batch.id}
                            className="block bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-pickle-green-200 hover:shadow-md transition"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className="font-mono text-lg font-bold text-pickle-green-700 bg-pickle-green-50 px-2 py-1 rounded">#{batch.id}</span>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar size={16} className="mr-1" />
                                        {batch.made_date}
                                    </div>
                                </div>
                                {batch.tasting_notes && batch.tasting_notes.length > 0 && (
                                    <div className="flex items-center text-yellow-400">
                                        <span className="text-gray-400 text-xs font-bold mr-1">{batch.tasting_notes.length} Reviews</span>
                                        <Star size={16} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            {(batch.notes || (batch.tasting_notes && batch.tasting_notes.length > 0)) && (
                                <div className="space-y-2 mt-2">
                                    {batch.notes && (
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                                            <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide block mb-1">Production</span>
                                            "{batch.notes}"
                                        </p>
                                    )}
                                    {batch.tasting_notes && batch.tasting_notes.length > 0 && (
                                        <div className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                                            <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide block mb-1">Latest Review</span>
                                            "{batch.tasting_notes[batch.tasting_notes.length - 1].note}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecipeDetail;
