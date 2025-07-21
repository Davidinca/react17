import React from 'react';
import ModelosList from '../../components/almacenes/modelos/ModelosList';
import Layout from "../../components/layout/Layout.jsx";


const ModelosPage = () => {
    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto">
                <ModelosList />
            </div>
        </Layout>
    );
};

export default ModelosPage;
