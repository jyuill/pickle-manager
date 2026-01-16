import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Save } from 'lucide-react';

const CreateRecipe = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: '',
        ingredients: '',
        instructions: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            const fetchRecipe = async () => {
                try {
                    const response = await api.get(`/recipes/${id}`);
                    setFormData({
                        name: response.data.name,
                        ingredients: response.data.ingredients,
                        instructions: response.data.instructions
                    });
                } catch (error) {
                    console.error("Failed to fetch recipe", error);
                }
            };
            fetchRecipe();
        }
    }, [id, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditMode) {
                await api.patch(`/recipes/${id}`, formData);
                navigate(`/manager/recipes/${id}`);
            } else {
                await api.post('/recipes/', formData);
                navigate('/manager');
            }
        } catch (error) {
            console.error("Failed to save recipe", error);
            alert("Failed to save recipe. Please try again.");
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
                <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Recipe' : 'New Recipe'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                {/* ... fields ... */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
                    <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pickle-green-500 focus:border-transparent outline-none transition"
                        placeholder="e.g. Spicy Garlic Dills"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
                    <textarea
                        required
                        rows={4}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pickle-green-500 focus:border-transparent outline-none transition"
                        placeholder="List ingredients here..."
                        value={formData.ingredients}
                        onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <textarea
                        required
                        rows={6}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pickle-green-500 focus:border-transparent outline-none transition"
                        placeholder="Step by step instructions..."
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 bg-pickle-green-600 text-white py-3 rounded-lg font-semibold hover:bg-pickle-green-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <Save size={20} />
                    <span>{loading ? 'Saving...' : (isEditMode ? 'Update Recipe' : 'Save Recipe')}</span>
                </button>
            </form>
        </div>
    );
};

export default CreateRecipe;
