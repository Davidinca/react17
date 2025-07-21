import React, { useEffect } from 'react';
import { Modal, ModalHeader, ModalBody } from 'flowbite-react';
import { HiX, HiPencilAlt, HiDocumentText, HiSave, HiExclamationCircle } from 'react-icons/hi';
import ContratoForm from "../forms/contratoForm.jsx";

const EditarContratoModal = ({ show, onClose, contrato, onSave }) => {
    // Manejar tecla Escape para cerrar
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && show) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [show, onClose]);

    // Si no hay contrato, no renderizar el modal
    if (!contrato) return null;

    const handleSubmit = (datos, errorHandler) => {
        // Pasar el errorHandler al onSave para manejo de errores del backend
        onSave(datos, errorHandler);
        // NO cerrar el modal aquí - se cerrará desde useContratos si todo sale bien
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <Modal
            show={show}
            onClose={onClose}
            size="4xl"
            popup
            className="z-50"
        >
            {/* Header personalizado con diseño de edición */}
            <div className="relative bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 rounded-t-lg overflow-hidden">
                {/* Efectos de fondo */}
                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent"></div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-2 -left-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>

                {/* Contenido del header */}
                <div className="relative px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="relative p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                            <HiPencilAlt className="w-6 h-6 text-white" />
                            {/* Indicador de edición */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                                <span>Editar Contrato</span>
                            </h2>
                            <p className="text-orange-100 text-sm mt-1 flex items-center space-x-2">
                                <HiDocumentText className="w-4 h-4" />
                                <span>ID: {contrato.id || contrato._id || 'N/A'} • Modificando información existente</span>
                            </p>
                        </div>
                    </div>

                    {/* Botón de cerrar con estilo de edición */}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm group border border-white/20"
                        aria-label="Cerrar modal"
                    >
                        <HiX className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
                    </button>
                </div>
            </div>

            {/* Body mejorado */}
            <ModalBody className="p-0">
                {/* Información del contrato actual */}
                <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
                    <div className="flex items-center space-x-3">
                        <HiExclamationCircle className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="text-sm font-medium text-amber-800">
                                Editando contrato existente
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                                Los cambios se aplicarán inmediatamente al guardar
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-6 bg-gray-50/50">
                    {/* Indicador de progreso de edición */}
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                            <div className="w-8 h-0.5 bg-amber-600"></div>
                            <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></div>
                            <div className="w-8 h-0.5 bg-amber-400"></div>
                            <div className="w-2 h-2 bg-amber-300 rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                            Modificación de datos
                        </span>
                    </div>

                    {/* Contenedor del formulario con estilo de edición */}
                    <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-amber-500 border border-gray-100 p-6">
                        <ContratoForm
                            contrato={contrato}
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            isEditing={true}
                        />
                    </div>
                </div>

                {/* Footer informativo mejorado */}
                <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 rounded-b-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <HiSave className="w-4 h-4 text-amber-600" />
                            <span>Los cambios se guardarán automáticamente</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-amber-600">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <span className="font-medium">Modo edición activo</span>
                            </div>
                            <div className="text-xs text-gray-400">
                                Esc para cancelar
                            </div>
                        </div>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default EditarContratoModal;