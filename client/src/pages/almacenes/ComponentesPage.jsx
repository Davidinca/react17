import React from 'react';
import ComponentesList from '../../components/almacenes/componentes/ComponentesList';
import Layout from "../../components/layout/Layout.jsx";

const ComponentesPage = () => {
    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto">
                <ComponentesList />
            </div>
        </Layout>
    );
};

export default ComponentesPage;