// pages/RolesPage.jsx
import React from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from '../../components/layout/Layout.jsx';
import RolesList from '../../components/roles/RolesList.jsx';

const RolesPage = () => {
    return (
        <Layout>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        borderRadius: '12px',
                        background: '#1f2937',
                        color: '#fff',
                    },
                }}
            />
            <div className="p-6 max-w-7xl mx-auto">
                <RolesList />
            </div>
        </Layout>
    );
};

export default RolesPage;
