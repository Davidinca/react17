import { Modal, ModalHeader, ModalBody } from 'flowbite-react';
import { HiX, HiDocumentText, HiPencil, HiPlus } from 'react-icons/hi';
import ContratoForm from "../forms/contratoForm.jsx";

const NuevoContratoModal = ({ show, onClose, onSave, contrato, clientes }) => {
    const isEditing = !!contrato;
    const titulo = isEditing ? 'Editar Contrato' : 'Nuevo Contrato';
    const Icon = isEditing ? HiPencil : HiPlus;

    return (
        <Modal
            show={show}
            onClose={onClose}
            size="2xl"
            popup
            className="z-50"
        >
            {/* Header personalizado con gradiente y animación */}
            <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-t-lg">
                {/* Patrón de fondo sutil */}
                <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white to-transparent rounded-t-lg"></div>

                {/* Contenido del header */}
                <div className="relative px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {titulo}
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">
                                {isEditing
                                    ? 'Modifica los datos del contrato existente'
                                    : 'Completa la información para crear un nuevo contrato'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Botón de cerrar mejorado */}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm group"
                        aria-label="Cerrar modal"
                    >
                        <HiX className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
                    </button>
                </div>
            </div>

            {/* Body con mejor spacing y diseño */}
            <ModalBody className="p-0">
                <div className="px-6 py-6 bg-gray-50/50">
                    {/* Indicador visual */}
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <div className="w-8 h-0.5 bg-blue-600"></div>
                            <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                            <div className="w-8 h-0.5 bg-gray-300"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                            Información del contrato
                        </span>
                    </div>

                    {/* Contenedor del formulario con sombra sutil */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <ContratoForm
                            contrato={contrato}
                            clientes={clientes}
                            onSubmit={onSave}
                            onCancel={onClose}
                        />
                    </div>
                </div>

                {/* Footer con información adicional */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-gray-500">
                            <HiDocumentText className="w-4 h-4" />
                            <span>Los campos marcados con * son obligatorios</span>
                        </div>
                        <div className="text-gray-400">
                            {isEditing ? 'Modo edición' : 'Modo creación'}
                        </div>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
};

export default NuevoContratoModal;
