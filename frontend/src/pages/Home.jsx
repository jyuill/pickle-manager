import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus } from 'lucide-react';

const Home = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [maxRating, setMaxRating] = useState(0);
    const [filteredBatches, setFilteredBatches] = useState([]);
    const [allBatches, setAllBatches] = useState([]); // Cache for client side or just base state? Using API call is better for real filters.

    // Actually, backend filtering is cleaner.

    // UI states
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const res = await api.get('/recipes/');
                if (Array.isArray(res.data)) {
                    setRecipes(res.data);
                } else {
                    console.error("Unexpected response format for recipes:", res.data);
                    setRecipes([]);
                }
            } catch (error) {
                console.error("Failed to fetch recipes", error);
            }
        };
        fetchRecipes();
    }, []);

    // Filter effect
    useEffect(() => {
        const fetchFilteredBatches = async () => {
            setIsSearching(true);
            try {
                const params = {};
                if (searchQuery) params.recipe_name = searchQuery;
                if (minRating > 0) params.min_rating = minRating;
                if (maxRating > 0) params.max_rating = maxRating;

                const res = await api.get('/batches/', { params });
                if (Array.isArray(res.data)) {
                    setFilteredBatches(res.data);
                } else {
                    console.error("Unexpected response format for batches:", res.data);
                    setFilteredBatches([]);
                }
            } catch (error) {
                console.error("Failed to search batches", error);
            } finally {
                setIsSearching(false);
                setLoading(false);
            }
        };

        // Debounce slightly
        const timeoutId = setTimeout(() => {
            fetchFilteredBatches();
        }, 300);

        return () => clearTimeout(timeoutId);

    }, [searchQuery, minRating, maxRating]);


    if (loading) return <div className="text-center py-10">Loading...</div>;

    return (
        <div className="space-y-8">
            {/* Batch Search Section */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">🔍</span> Find a Batch
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search by Recipe/Ingredient</label>
                        <input
                            type="text"
                            placeholder="e.g. 'Spicy Cucumber'"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pickle-green-500 focus:border-transparent outline-none transition"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => {
                                        const newMin = minRating === star ? 0 : star;
                                        setMinRating(newMin);
                                        // Ensure max is invalid if less than new min
                                        if (maxRating > 0 && maxRating < newMin) {
                                            setMaxRating(0); // or setMaxRating(newMin)
                                        }
                                    }}
                                    className={`focus:outline-none transition-transform hover:scale-110 ${minRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-400">{minRating > 0 ? `${minRating}+ Stars` : 'Any'}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Rating</label>
                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => {
                                        const newMax = maxRating === star ? 0 : star;
                                        setMaxRating(newMax);
                                        // If setting a max lower than min, reset min? Or prefer smart behavior?
                                        if (newMax > 0 && minRating > newMax) {
                                            setMinRating(newMax);
                                        }
                                    }}
                                    className={`focus:outline-none transition-transform hover:scale-110 ${maxRating >= star && maxRating > 0 ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-400">{maxRating > 0 ? `Max ${maxRating}` : 'Any'}</span>
                        </div>
                    </div>
                </div>

                {/* Results Area */}
                <div className="mt-6">
                    {isSearching ? (
                        <div className="text-center text-gray-400 py-4">Searching...</div>
                    ) : filteredBatches.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {filteredBatches.map((batch) => (
                                <Link
                                    key={batch.id}
                                    to={`/manager/batches/${batch.id}`}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-pickle-green-50 hover:text-pickle-green-800 transition group"
                                >
                                    <div>
                                        <span className="font-mono font-bold mr-2">#{batch.id}</span>
                                        <span className="text-gray-500 text-sm">{batch.made_date}</span>
                                    </div>
                                    <div className="flex items-center">
                                        {batch.average_rating !== null && batch.average_rating !== undefined && (
                                            <span className="flex items-center text-yellow-500 mr-3 font-semibold">
                                                {batch.average_rating} <span className="ml-1 text-lg">★</span>
                                            </span>
                                        )}
                                        <span className="text-gray-400 group-hover:text-pickle-green-600">View →</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-400 text-sm italic">
                            {(searchQuery || minRating > 0 || maxRating > 0) ? "No matching batches found." : "Enter search terms to find batches."}
                        </div>
                    )}
                </div>
            </section>

            <div className="border-b border-gray-200"></div>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">My Recipes</h1>
                    <Link
                        to="/manager/new-recipe"
                        className="md:flex hidden items-center space-x-2 bg-pickle-green-600 text-white px-4 py-2 rounded-lg hover:bg-pickle-green-700 transition shadow-sm"
                    >
                        <Plus size={20} />
                        <span>New Recipe</span>
                    </Link>
                </div>

                {recipes.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 mb-4">No recipes yet. Start pickling!</p>
                        <p className="text-gray-500 mb-4">No recipes yet. Start pickling!</p>
                        <Link
                            to="/manager/new-recipe"
                            className="inline-flex items-center space-x-2 text-pickle-green-600 font-semibold hover:underline"
                        >
                            Create your first recipe
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recipes.map((recipe) => (
                            <Link
                                key={recipe.id}
                                to={`/manager/recipes/${recipe.id}`}
                                className="block bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-pickle-green-200 transition"
                            >
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">{recipe.name}</h2>
                                <p className="text-sm text-gray-500 line-clamp-2">{recipe.ingredients}</p>
                                <div className="mt-3 text-xs text-gray-400">
                                    Created on {new Date(recipe.created_at).toLocaleDateString()}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home;
