// src/components/Loader.jsx
import React from 'react';

const Loader = () => {
    return (
        <div className="flex justify-center items-center h-screen">
            <div role="status">
                <svg
                    aria-hidden="true"
                    className="inline w-8 h-8 text-gray-200 animate-spin fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50..."
                        fill="currentColor"
                    />
                    <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 ..."
                        fill="currentFill"
                    />
                </svg>
                <span className="sr-only">Cargando...</span>
            </div>
        </div>
    );
};

export default Loader;
