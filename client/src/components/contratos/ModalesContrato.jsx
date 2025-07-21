// components/contratos/ModalesContrato.jsx
import React from 'react';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import NuevoContratoModal from '../modals/nuevoContratoModal.jsx';
import EditarContratoModal from '../modals/EditarContratoModal';

const ModalesContrato = ({
                             modalContratoAbierto,
                             modalEditarAbierto,
                             modalEliminarAbierto,
                             clientes,
                             contratoSeleccionado,
                             onClose,
                             onGuardarNuevo,
                             onGuardarEdicion,
                             onConfirmarEliminar
                         }) => {
    return (
        <>
            <NuevoContratoModal
                show={modalContratoAbierto}
                onClose={onClose}
                clientes={clientes}
                onSave={onGuardarNuevo}
            />

            <EditarContratoModal
                show={modalEditarAbierto}
                onClose={onClose}
                contrato={contratoSeleccionado}
                clientes={clientes}
                onSave={onGuardarEdicion}
            />

            <ConfirmDeleteModal
                show={modalEliminarAbierto}
                onClose={onClose}
                onConfirm={onConfirmarEliminar}
                contrato={contratoSeleccionado}
            />
        </>
    );
};

export default ModalesContrato;