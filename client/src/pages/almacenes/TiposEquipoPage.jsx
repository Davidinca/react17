import React from 'react';
import TiposEquipoList from '../../components/almacenes/tipos-equipo/TiposEquipoList';
import Layout from "../../components/layout/Layout.jsx";

const TiposEquipoPage = () => {
    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto">
                <TiposEquipoList />
            </div>
        </Layout>
    );
};

export default TiposEquipoPage;