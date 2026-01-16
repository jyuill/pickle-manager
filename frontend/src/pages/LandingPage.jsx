import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2 } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center p-6 text-center">

            <div className="bg-white p-8 rounded-full shadow-xl mb-8 animate-fade-in-up">
                <img
                    src="/pickle-j-right-circle-gemini.png"
                    alt="Pickle Johnny Logo"
                    className="w-48 h-48 md:w-64 md:h-64 object-cover"
                />
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-pickle-green-800 mb-4 tracking-tight">
                Pickle Johnny
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-lg mx-auto">
                Single jar fermentation, house-made recipes...outrageously good pickles!
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                    to="/manager"
                    className="flex items-center justify-center space-x-2 bg-pickle-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-pickle-green-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto"
                >
                    <span>Launch App</span>
                    <ArrowRight size={20} />
                </Link>

                <Link
                    to="/stats"
                    className="flex items-center justify-center space-x-2 bg-white text-pickle-green-700 border-2 border-pickle-green-100 px-8 py-4 rounded-xl font-bold text-lg hover:border-pickle-green-600 hover:text-pickle-green-800 transition w-full sm:w-auto"
                >
                    <BarChart2 size={20} />
                    <span>View Stats</span>
                </Link>
            </div>

            <div className="mt-16 text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Pickle Johnny. All rights preserved.
            </div>
        </div>
    );
};

export default LandingPage;
