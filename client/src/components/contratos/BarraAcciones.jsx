// components/contratos/BarraAcciones.jsx
import React from 'react';
import { Permiso } from '../../api/permisos.js';
import { FiPlus, FiList } from 'react-icons/fi';

const BarraAcciones = ({ onNuevoContrato, onCargarListado }) => {
    return (
        <div className="flex flex-wrap gap-3">
            <Permiso recurso="contratos" accion="crear">
                <button
                    className="inline-flex items-center px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    onClick={onNuevoContrato}
                >
                    <FiPlus className="w-5 h-5 mr-2" />
                    Nuevo Contrato
                </button>
            </Permiso>

            <Permiso recurso="contratos" accion="leer">
                <button
                    className="inline-flex items-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    onClick={onCargarListado}
                >
                    <FiList className="w-5 h-5 mr-2" />
                    Ver Todos
                </button>
            </Permiso>
        </div>
    );
};

export default BarraAcciones;
