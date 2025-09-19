import React, { useState } from 'react';
import { Button } from '@material-tailwind/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ConsultaClienteModal from './modals/ConsultaClienteModal';

const ConsultaCliente = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consulta de Clientes</h1>
          <p className="text-gray-600">Migra y consulta datos de clientes, servicios y facturas</p>
        </div>
        
        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2"
          color="blue"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
          Nueva Consulta
        </Button>
      </div>

      <ConsultaClienteModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default ConsultaCliente;