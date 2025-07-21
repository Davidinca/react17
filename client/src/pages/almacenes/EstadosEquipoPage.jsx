import React from 'react';
import EstadosEquipoList from '../../components/almacenes/estados-equipo/EstadosEquipoList';
import Layout from "../../components/layout/Layout.jsx";

const EstadosEquipoPage = () => {
    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto">
                <EstadosEquipoList />
            </div>
        </Layout>
    );
};

export default EstadosEquipoPage;
