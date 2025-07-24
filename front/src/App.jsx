// src/App.jsx
import React from 'react';
import { Button, Card, CardBody, Typography } from "@material-tailwind/react";
import { UsersIcon } from '@heroicons/react/24/outline';
import ClienteDashboard from './components/maps/ClienteDashboard';

function App() {
  const [showClientes, setShowClientes] = React.useState(false);

  if (showClientes) {
    return <ClienteDashboard />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-96">
        <CardBody className="text-center">
          <Typography variant="h5" color="blue-gray" className="mb-4">
            ¡Material Tailwind está funcionando!
          </Typography>
          
          <Typography variant="small" color="gray" className="mb-6">
            Sistema de Gestión de Clientes con Google Maps
          </Typography>
          
          <div className="space-y-3">
            <Button color="blue" className="w-full">
              Botón de Prueba
            </Button>
            
            <Button 
              color="green" 
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setShowClientes(true)}
            >
              <UsersIcon className="h-5 w-5" />
              Ir a Gestión de Clientes
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default App;