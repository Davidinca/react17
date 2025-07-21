// pages/BuscarContrato.jsx
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useContratos } from '../hooks/useContratos.js';
import Layout from '../components/layout/Layout.jsx';
import BuscadorContrato from '../components/contratos/BuscadorContrato';
import TablaContrato from '../components/contratos/TablaContrato';
import ModalesContrato from '../components/contratos/ModalesContrato';
import BarraAcciones from '../components/contratos/BarraAcciones';
import { FiSearch, FiFileText, FiAlertCircle } from 'react-icons/fi';

const BuscarContrato = () => {
    const {
        // Estados
        numeroContrato,
        setNumeroContrato,
        resultado,
        error,
        isLoading,
        clientes,
        listado,
        contratoSeleccionado,

        // Estados de modales
        modalEliminarAbierto,
        modalContratoAbierto,
        modalEditarAbierto,

        // Funciones de búsqueda
        buscar,
        handleBuscarSubmit,
        cargarListado,

        // Funciones de modales
        abrirModalEliminar,
        abrirNuevoContrato,
        abrirEditarContrato,
        cerrarModales,

        // Funciones de CRUD
        confirmarEliminar,
        guardarNuevoContrato,
        guardarEdicionContrato
    } = useContratos();

    return (
        <Layout>
            <div className="min-h-screen bg-[rgb(122,122,122)] p-4">
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

                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <FiSearch className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Gestión de Contratos</h1>
                                <p className="text-gray-600 mt-1">Buscar, crear y administrar contratos de clientes</p>
                            </div>
                        </div>

                        <BuscadorContrato
                            numeroContrato={numeroContrato}
                            setNumeroContrato={setNumeroContrato}
                            onBuscar={buscar}
                            onSubmit={handleBuscarSubmit}
                            isLoading={isLoading}
                        />

                        <BarraAcciones
                            onNuevoContrato={abrirNuevoContrato}
                            onCargarListado={cargarListado}
                        />
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg shadow-sm">
                            <div className="flex items-center">
                                <FiAlertCircle className="w-5 h-5 text-red-400 mr-3" />
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Resultado de búsqueda individual */}
                    {resultado && (
                        <TablaContrato
                            titulo="Resultado de Búsqueda"
                            contratos={[resultado]}
                            mostrarAcciones={true}
                            onEditar={abrirEditarContrato}
                            onEliminar={abrirModalEliminar}
                            variant="individual"
                        />
                    )}

                    {/* Listado completo */}
                    {listado.length > 0 && (
                        <TablaContrato
                            titulo="Todos los Contratos"
                            contratos={listado}
                            mostrarAcciones={false}
                            variant="listado"
                            className="mt-8"
                        />
                    )}

                    <ModalesContrato
                        modalContratoAbierto={modalContratoAbierto}
                        modalEditarAbierto={modalEditarAbierto}
                        modalEliminarAbierto={modalEliminarAbierto}
                        clientes={clientes}
                        contratoSeleccionado={contratoSeleccionado}
                        onClose={cerrarModales}
                        onGuardarNuevo={guardarNuevoContrato}
                        onGuardarEdicion={guardarEdicionContrato}
                        onConfirmarEliminar={confirmarEliminar}
                    />
                </div>
            </div>
        </Layout>
    );
};

export default BuscarContrato;
