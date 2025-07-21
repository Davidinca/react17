import React from 'react';
import LotesList from '../../components/almacenes/lotes/LotesList';
import Layout from "../../components/layout/Layout.jsx";

const LotesPage = () => {
    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto">
                <LotesList />
            </div>
        </Layout>
    );
};

export default LotesPage;
