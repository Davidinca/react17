// components/contratos/TablaContrato.jsx
import React, { useState, useEffect } from 'react';
import FilaContrato from './FilaContrato';
import { FiFileText, FiUsers, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const TablaContrato = ({
                           titulo,
                           contratos,
                           mostrarAcciones = false,
                           onEditar,
                           onEliminar,
                           variant = "listado",
                           className = "",
                           itemsPorPagina = 10,
                           mostrarPaginacion = true
                       }) => {
    const [paginaActual, setPaginaActual] = useState(1);

    // Reset página cuando cambien los contratos
    useEffect(() => {
        setPaginaActual(1);
    }, [contratos]);

    if (!contratos || contratos.length === 0) return null;

    const isIndividual = variant === "individual";
    const IconComponent = isIndividual ? FiFileText : FiUsers;
    const bgColor = isIndividual ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200";

    // Cálculos de paginación
    const totalPaginas = Math.ceil(contratos.length / itemsPorPagina);
    const indiceInicio = (paginaActual - 1) * itemsPorPagina;
    const indiceFin = indiceInicio + itemsPorPagina;
    const contratosPaginados = mostrarPaginacion
        ? contratos.slice(indiceInicio, indiceFin)
        : contratos;

    // Funciones de navegación
    const irAPagina = (pagina) => {
        setPaginaActual(Math.max(1, Math.min(pagina, totalPaginas)));
    };

    const paginaAnterior = () => {
        if (paginaActual > 1) {
            setPaginaActual(paginaActual - 1);
        }
    };

    const paginaSiguiente = () => {
        if (paginaActual < totalPaginas) {
            setPaginaActual(paginaActual + 1);
        }
    };

    // Generar números de página para mostrar
    const generarNumerosPagina = () => {
        const numeros = [];
        const maxVisible = 5;

        if (totalPaginas <= maxVisible) {
            for (let i = 1; i <= totalPaginas; i++) {
                numeros.push(i);
            }
        } else {
            if (paginaActual <= 3) {
                for (let i = 1; i <= 4; i++) numeros.push(i);
                numeros.push('...');
                numeros.push(totalPaginas);
            } else if (paginaActual >= totalPaginas - 2) {
                numeros.push(1);
                numeros.push('...');
                for (let i = totalPaginas - 3; i <= totalPaginas; i++) numeros.push(i);
            } else {
                numeros.push(1);
                numeros.push('...');
                for (let i = paginaActual - 1; i <= paginaActual + 1; i++) numeros.push(i);
                numeros.push('...');
                numeros.push(totalPaginas);
            }
        }

        return numeros;
    };

    return (
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
            {/* Header de la tabla */}
            <div className={`px-6 py-4 border-b border-gray-100 ${bgColor}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isIndividual ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <IconComponent className={`w-5 h-5 ${isIndividual ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
                            <p className="text-sm text-gray-600">
                                {contratos.length} {contratos.length === 1 ? 'contrato encontrado' : 'contratos encontrados'}
                            </p>
                        </div>
                    </div>

                    {/* Información de paginación en el header */}
                    {mostrarPaginacion && totalPaginas > 1 && (
                        <div className="text-sm text-gray-600">
                            Mostrando {indiceInicio + 1} - {Math.min(indiceFin, contratos.length)} de {contratos.length}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabla responsive */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            N° Contrato
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Cliente
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            CI
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Dirección
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Teléfono
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Servicios
                        </th>
                        {mostrarAcciones && (
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Acciones
                            </th>
                        )}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {contratosPaginados.map((contrato, index) => (
                        <FilaContrato
                            key={contrato.id || contrato.numero_contrato}
                            contrato={contrato}
                            mostrarAcciones={mostrarAcciones}
                            onEditar={onEditar}
                            onEliminar={onEliminar}
                            isEven={index % 2 === 0}
                        />
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Controles de paginación */}
            {mostrarPaginacion && totalPaginas > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Página {paginaActual} de {totalPaginas}
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Botón Anterior */}
                            <button
                                onClick={paginaAnterior}
                                disabled={paginaActual === 1}
                                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                            >
                                <FiChevronLeft className="w-4 h-4 mr-1" />
                                Anterior
                            </button>

                            {/* Números de página */}
                            <div className="flex items-center space-x-1">
                                {generarNumerosPagina().map((numero, index) => (
                                    <React.Fragment key={index}>
                                        {numero === '...' ? (
                                            <span className="px-3 py-2 text-sm text-gray-400">...</span>
                                        ) : (
                                            <button
                                                onClick={() => irAPagina(numero)}
                                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                    paginaActual === numero
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {numero}
                                            </button>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Botón Siguiente */}
                            <button
                                onClick={paginaSiguiente}
                                disabled={paginaActual === totalPaginas}
                                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                            >
                                Siguiente
                                <FiChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablaContrato;