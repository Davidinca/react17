import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'flowbite-react';
import { MdWarning, MdDelete } from 'react-icons/md';

const ConfirmDeleteModal = ({ show, onClose, onConfirm, contrato }) => (
    <Modal show={show} onClose={onClose} size="md" popup className="backdrop-blur-sm">
        <div className="relative bg-white rounded-lg shadow-xl border-0 overflow-hidden">
            {/* Header con icono de advertencia */}
            <ModalHeader className="border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4">
                <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <MdWarning className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Confirmar Eliminación
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Esta acción no se puede deshacer
                        </p>
                    </div>
                </div>
            </ModalHeader>

            {/* Cuerpo del modal */}
            <ModalBody className="px-6 py-6">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <MdDelete className="w-6 h-6 text-red-600" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-gray-800 font-medium">
                            ¿Estás seguro de que deseas eliminar este contrato?
                        </p>

                        {contrato?.numero_contrato && (
                            <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-red-400">
                                <p className="text-sm text-gray-600">Contrato:</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {contrato.numero_contrato}
                                </p>
                            </div>
                        )}

                        <p className="text-sm text-gray-500 mt-3">
                            Esta acción eliminará permanentemente el contrato y todos sus datos asociados.
                        </p>
                    </div>
                </div>
            </ModalBody>

            {/* Footer con botones mejorados */}
            <ModalFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="flex justify-end space-x-3 w-full">
                    <Button
                        color="gray"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 font-medium rounded-lg transition-colors duration-200"
                    >
                        Cancelar
                    </Button>
                    <Button
                        color="failure"
                        onClick={() => { onConfirm(); onClose(); }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-200 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                        <MdDelete className="w-4 h-4" />
                        <span>Sí, eliminar</span>
                    </Button>
                </div>
            </ModalFooter>
        </div>
    </Modal>
);

export default ConfirmDeleteModal;