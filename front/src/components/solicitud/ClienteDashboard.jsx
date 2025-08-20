// src/components/maps/ClienteDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Alert,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel
} from '@material-tailwind/react';
import {
  PlusIcon,
  ChartBarIcon,
  MapIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import ClienteForm from './ClienteForm';
import ClienteList from './ClienteList';
import ClienteDetail from './ClienteDetail';
import EstadisticasPanel from './EstadisticasPanel';
import MapaGeneral from './MapaGeneral';
import { clienteService } from './services/servi';

const ClienteDashboard = () => {
  const [activeTab, setActiveTab] = useState('lista');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleNewCliente = () => {
    setSelectedCliente(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEditCliente = (cliente) => {
    setSelectedCliente(cliente);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleViewCliente = (cliente) => {
    setSelectedCliente(cliente);
    setShowDetail(true);
  };

  const handleDeleteCliente = (cliente) => {
    setDeleteConfirm(cliente);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await clienteService.delete(deleteConfirm.id);
      setSuccess(`Cliente ${deleteConfirm.nombre_completo} eliminado exitosamente`);
      setRefreshTrigger(prev => prev + 1);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
      setDeleteConfirm(null);
    }
  };

  const handleSaveCliente = (cliente) => {
    setSuccess(
      isEditing 
        ? `Cliente ${cliente.nombre} ${cliente.apellido} actualizado exitosamente`
        : `Cliente ${cliente.nombre} ${cliente.apellido} creado exitosamente`
    );
    setShowForm(false);
    setSelectedCliente(null);
    setIsEditing(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedCliente(null);
    setIsEditing(false);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedCliente(null);
  };

  const tabsData = [
    {
      label: 'Lista',
      value: 'lista',
      icon: UsersIcon,
      component: (
        <ClienteList
          onEdit={handleEditCliente}
          onView={handleViewCliente}
          onDelete={handleDeleteCliente}
          refreshTrigger={refreshTrigger}
        />
      )
    },
    {
      label: 'Mapa',
      value: 'mapa',
      icon: MapIcon,
      component: (
        <MapaGeneral
          onEdit={handleEditCliente}
          onView={handleViewCliente}
          refreshTrigger={refreshTrigger}
        />
      )
    },
    {
      label: 'Estadísticas',
      value: 'estadisticas',
      icon: ChartBarIcon,
      component: (
        <EstadisticasPanel
          refreshTrigger={refreshTrigger}
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="h3" color="blue-gray">
                  Gestión de Clientes
                </Typography>
                <Typography color="gray" className="mt-1">
                  Sistema de gestión de solicitudes de servicio con ubicación
                </Typography>
              </div>
              <Button
                className="flex items-center gap-3"
                onClick={handleNewCliente}
              >
                <PlusIcon className="h-5 w-5" />
                Nuevo Cliente
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Mensajes de estado */}
        {error && (
          <Alert color="red" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert color="green" dismissible onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Tabs principales */}
        <Card>
          <CardBody className="p-0">
            <Tabs value={activeTab} onChange={setActiveTab}>
              <TabsHeader className="rounded-none border-b border-blue-gray-50 bg-transparent p-0">
                {tabsData.map(({ label, value, icon: Icon }) => (
                  <Tab
                    key={value}
                    value={value}
                    className="flex items-center gap-2 px-6 py-3"
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Tab>
                ))}
              </TabsHeader>
              
              <TabsBody>
                {tabsData.map(({ value, component }) => (
                  <TabPanel key={value} value={value} className="p-6">
                    {component}
                  </TabPanel>
                ))}
              </TabsBody>
            </Tabs>
          </CardBody>
        </Card>
      </div>

      {/* Dialog de Formulario */}
      <Dialog
        size="xl"
        open={showForm}
        handler={() => setShowForm(false)}
        className="max-w-4xl"
      >
        <DialogBody className="p-0">
          <ClienteForm
            cliente={selectedCliente}
            onSave={handleSaveCliente}
            onCancel={handleCancelForm}
            isEditing={isEditing}
          />
        </DialogBody>
      </Dialog>

      {/* Dialog de Detalle */}
      <Dialog
        size="lg"
        open={showDetail}
        handler={() => setShowDetail(false)}
        className="max-w-3xl"
      >
        <DialogBody className="p-0">
          {selectedCliente && (
            <ClienteDetail
              cliente={selectedCliente}
              onClose={handleCloseDetail}
              onEdit={() => {
                setShowDetail(false);
                handleEditCliente(selectedCliente);
              }}
            />
          )}
        </DialogBody>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        size="sm"
        open={!!deleteConfirm}
        handler={() => setDeleteConfirm(null)}
      >
        <DialogHeader>
          <Typography variant="h5" color="red">
            Confirmar Eliminación
          </Typography>
        </DialogHeader>
        
        <DialogBody>
          <Typography>
            ¿Está seguro que desea eliminar al cliente{' '}
            <strong>{deleteConfirm?.nombre_completo}</strong>?
          </Typography>
          <Typography color="red" className="mt-2 text-sm">
            Esta acción no se puede deshacer.
          </Typography>
        </DialogBody>
        
        <DialogFooter className="space-x-2">
          <Button
            variant="outlined"
            onClick={() => setDeleteConfirm(null)}
          >
            Cancelar
          </Button>
          <Button
            color="red"
            onClick={confirmDelete}
          >
            Eliminar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ClienteDashboard;