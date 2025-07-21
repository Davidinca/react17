import React from 'react';
import EquiposONUList from '../../components/almacenes/equipos-onu/EquiposONUList';
import Layout from "../../components/layout/Layout.jsx";

const EquiposONUPage = () => {
    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto">
                <EquiposONUList />
            </div>
        </Layout>
    );
};

export default EquiposONUPage;