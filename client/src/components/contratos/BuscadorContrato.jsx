// components/contratos/BuscadorContrato.jsx
import React from 'react';
import { FiSearch, FiLoader } from 'react-icons/fi';

const BuscadorContrato = ({
                              numeroContrato,
                              setNumeroContrato,
                              onBuscar,
                              onSubmit,
                              isLoading
                          }) => {
    return (
        <form onSubmit={onSubmit} className="mb-6">
            <div className="relative flex items-center">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <FiSearch className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        placeholder="Ingrese el número de contrato (8 dígitos)"
                        value={numeroContrato}
                        onChange={e => setNumeroContrato(e.target.value)}
                        maxLength={8}
                    />
                </div>
                <button
                    type="button"
                    className="ml-4 inline-flex items-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isLoading}
                    onClick={onBuscar}
                >
                    {isLoading ? (
                        <>
                            <FiLoader className="w-5 h-5 mr-2 animate-spin" />
                            Buscando...
                        </>
                    ) : (
                        <>
                            <FiSearch className="w-5 h-5 mr-2" />
                            Buscar
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default BuscadorContrato;