// components/contratos/FilaContrato.jsx
import React from 'react';
import { Permiso } from '../../api/permisos.js';
import { FiEdit3, FiTrash2, FiPhone, FiMapPin, FiUser, FiCreditCard } from 'react-icons/fi';

const FilaContrato = ({ contrato, mostrarAcciones, onEditar, onEliminar, isEven }) => {
    const formatearServicios = (servicios) => {
        if (!Array.isArray(servicios)) return 'Sin servicios';
        return servicios.map(s => s.tipo_servicio).join(', ');
    };

    const nombreCompleto = `${contrato.cliente.nombres} ${contrato.cliente.apellidos}`;

    return (
        <tr className={`hover:bg-gray-50 transition-colors duration-150 ${isEven ? 'bg-white' : 'bg-gray-25'}`}>
            <td className="px-6 py-4">
                <div className="flex items-center">
                    <FiCreditCard className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-bold text-blue-600 text-lg">
                        {contrato.numero_contrato}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center">
                    <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-semibold text-gray-900">{nombreCompleto}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {contrato.cliente.ci}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center text-gray-600">
                    <FiMapPin className="w-4 h-4 mr-2" />
                    <span className="truncate max-w-xs">{contrato.cliente.direccion}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center text-gray-600">
                    <FiPhone className="w-4 h-4 mr-2" />
                    <span>{contrato.cliente.telefono}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                    {Array.isArray(contrato.servicios) && contrato.servicios.length > 0 ? (
                        contrato.servicios.map((servicio, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                                {servicio.tipo_servicio}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 italic">Sin servicios</span>
                    )}
                </div>
            </td>
            {mostrarAcciones && (
                <td className="px-6 py-4">
                    <AccionesContrato
                        contrato={contrato}
                        onEditar={onEditar}
                        onEliminar={onEliminar}
                    />
                </td>
            )}
        </tr>
    );
};

const AccionesContrato = ({ contrato, onEditar, onEliminar }) => {
    return (
        <div className="flex space-x-2">
            <Permiso recurso="contratos" accion="actualizar">
                <button
                    className="inline-flex items-center p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors duration-150"
                    onClick={() => onEditar(contrato)}
                    title="Editar contrato"
                >
                    <FiEdit3 className="w-4 h-4" />
                </button>
            </Permiso>
            <Permiso recurso="contratos" accion="eliminar">
                <button
                    className="inline-flex items-center p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-150"
                    onClick={() => onEliminar(contrato)}
                    title="Eliminar contrato"
                >
                    <FiTrash2 className="w-4 h-4" />
                </button>
            </Permiso>
        </div>
    );
};

export default FilaContrato;