import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

const LoginModal = ({ onClose }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password) {
            localStorage.setItem('admin_password', password);
            onClose();
            // Optional: Reload to clear state/retry, but simpler to just close for now
            // window.location.reload(); 
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
                <div className="bg-pickle-green-600 p-6 text-center">
                    <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-3 text-white">
                        <Lock size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Admin Access</h2>
                    <p className="text-pickle-green-100 text-sm mt-1">Please enter the password to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <input
                            type="password"
                            autoFocus
                            placeholder="Password"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pickle-green-500 outline-none transition text-center text-lg"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-pickle-green-600 text-white py-3 rounded-lg font-bold hover:bg-pickle-green-700 transition"
                    >
                        Unlock
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full mt-3 text-gray-400 text-sm hover:text-gray-600"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
