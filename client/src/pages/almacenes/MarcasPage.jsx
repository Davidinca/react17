// ======================================================
// PASO 5: src/pages/almacenes/MarcasPage.jsx
// ======================================================

import React from 'react';
import MarcasList from '../../components/almacenes/marcas/MarcasList';
import Layout from "../../components/layout/Layout.jsx";

const MarcasPage = () => {
    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto">
                <MarcasList />
            </div>
        </Layout>
        
    );
};

export default MarcasPage;