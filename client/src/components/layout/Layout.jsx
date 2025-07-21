// Layout.jsx - Sin sidebar
import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen" style={{background: 'rgb(122, 122, 122)'}}>
            {/* Navbar fijo */}
            <Navbar />

            {/* Contenido principal - ya no necesita margen para sidebar */}
            <main className="p-6 pt-20"> {/* pt-20 para compensar navbar fijo */}
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;