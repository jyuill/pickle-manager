import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, Home } from 'lucide-react';

const Layout = ({ children }) => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-pickle-green-600 text-white shadow-md">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/manager" className="flex items-center space-x-2 text-xl font-bold hover:text-pickle-green-100 transition">
                        <img src="/pickle-j-right-circle-gemini.png" alt="Pickle Manager" className="w-8 h-8 rounded-full" />
                        <span>Pickle Manager</span>
                    </Link>
                    <nav className="flex space-x-4">
                        <Link
                            to="/manager"
                            className={`p-2 rounded-full hover:bg-pickle-green-700 transition ${location.pathname === '/manager' ? 'bg-pickle-green-700' : ''}`}
                        >
                            <Home size={24} />
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-grow max-w-4xl mx-auto w-full p-4 mb-20">
                {children}
            </main>

            {/* Mobile Floating Action Button for creating recipe */}
            <div className="fixed bottom-6 right-6 md:hidden">
                <Link
                    to="/manager/new-recipe"
                    className="flex items-center justify-center w-14 h-14 bg-pickle-green-600 text-white rounded-full shadow-lg hover:bg-pickle-green-700 transition focus:outline-none focus:ring-4 focus:ring-pickle-green-300"
                >
                    <PlusCircle size={28} />
                </Link>
            </div>
        </div>
    );
};

export default Layout;
