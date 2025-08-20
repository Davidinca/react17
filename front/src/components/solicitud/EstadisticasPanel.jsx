// src/components/maps/EstadisticasPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Progress,
  Alert
} from '@material-tailwind/react';
import {
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { clienteService } from './services/servi';

// Función para formatear números con separadores de miles
const formatNumber = (num) => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || '0';
};

const EstadisticasPanel = ({ refreshTrigger }) => {
  const [estadisticas, setEstadisticas] = useState({
    resumen: {},
    por_estado: [],
    por_tipo: [],
    por_cobertura: [],
    top_zonas: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEstadisticas();
  }, [refreshTrigger]);

  const loadEstadisticas = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsData = await clienteService.getEstadisticas();
      console.log('Datos de estadísticas recibidos:', statsData);
      setEstadisticas({
        resumen: statsData.resumen || {},
        por_estado: statsData.por_estado || [],
        por_tipo: statsData.por_tipo || [],
        por_cobertura: statsData.por_cobertura || [],
        top_zonas: statsData.top_zonas || []
      });
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError(err.message || 'Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el nombre legible del estado
  const getEstadoLabel = (estado) => {
    const estados = {
      'PEND_COBERTURA': 'Pendiente por cobertura',
      'PEND_EQUIPO': 'Pendiente por equipo',
      'PEND_INSTALACION': 'Pendiente por instalación',
      'ACTIVO': 'Activo',
      'SUSPENDIDO': 'Suspendido'
    };
    return estados[estado] || estado;
  };

  // Función para obtener el nombre legible del tipo de cliente
  const getTipoClienteLabel = (tipo) => {
    return tipo === 'COMUN' ? 'Usuario común' : 'Empresa';
  };

  // Función para obtener el nombre legible de la cobertura
  const getCoberturaLabel = (cobertura) => {
    return cobertura === 'CON_COBERTURA' ? 'Con cobertura' : 'Sin cobertura';
  };

  // Función para obtener el color según el estado
  const getEstadoColor = (estado) => {
    const colores = {
      'PEND_COBERTURA': 'bg-amber-100 text-amber-800',
      'PEND_EQUIPO': 'bg-blue-100 text-blue-800',
      'PEND_INSTALACION': 'bg-purple-100 text-purple-800',
      'ACTIVO': 'bg-green-100 text-green-800',
      'SUSPENDIDO': 'bg-red-100 text-red-800',
      'SIN_COBERTURA': 'bg-gray-100 text-gray-800',
      'CON_COBERTURA': 'bg-cyan-100 text-cyan-800',
      'COMUN': 'bg-indigo-100 text-indigo-800',
      'EMPRESA': 'bg-pink-100 text-pink-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <CardBody>
            <div className="flex justify-center items-center h-64">
              <Typography variant="h6">Cargando estadísticas...</Typography>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert color="red">
          <Typography variant="small" color="red">
            {error}
          </Typography>
        </Alert>
      </div>
    );
  }

  // Extraer datos para facilitar el acceso
  const { resumen, por_estado, por_tipo, por_cobertura, top_zonas } = estadisticas;

  return (
    <div className="p-4 space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Clientes */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="small" color="blue-gray" className="font-normal">
                  Total de Clientes
                </Typography>
                <Typography variant="h4" color="blue-gray" className="mt-1">
                  {formatNumber(resumen.total_clientes || 0)}
                </Typography>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <UsersIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Clientes Activos */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="small" color="blue-gray" className="font-normal">
                  Clientes Activos
                </Typography>
                <div className="flex items-center gap-2">
                  <Typography variant="h4" color="blue-gray" className="mt-1">
                    {formatNumber(resumen.total_activos || 0)}
                  </Typography>
                  <span className="text-sm text-green-500">
                    ({resumen.porcentaje_activos || 0}%)
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Pendientes */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="small" color="blue-gray" className="font-normal">
                  Pendientes
                </Typography>
                <Typography variant="h4" color="blue-gray" className="mt-1">
                  {formatNumber(resumen.total_pendientes || 0)}
                </Typography>
              </div>
              <div className="p-3 rounded-full bg-amber-50">
                <ClockIcon className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Suspendidos */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="small" color="blue-gray" className="font-normal">
                  Suspendidos
                </Typography>
                <Typography variant="h4" color="blue-gray" className="mt-1">
                  {formatNumber(resumen.total_suspendidos || 0)}
                </Typography>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <XCircleIcon className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Gráficos y estadísticas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Estado */}
        <Card>
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <Typography variant="h6" color="blue-gray">
              Distribución por Estado
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {por_estado.map(({ estado, total }) => (
                <div key={estado}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getEstadoColor(estado).split(' ')[0]}`} />
                      <Typography variant="small" className="font-medium">
                        {getEstadoLabel(estado)}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{total}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(estado)}`}>
                        {((total / resumen.total_clientes) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(total / resumen.total_clientes) * 100} 
                    color={
                      estado === 'ACTIVO' ? 'green' : 
                      estado === 'SUSPENDIDO' ? 'red' : 
                      estado.includes('PEND_') ? 'blue' : 'gray'
                    } 
                    size="lg"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Top Zonas */}
        <Card>
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <Typography variant="h6" color="blue-gray">
              Top 5 Zonas
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {top_zonas.map(({ zona, total }, index) => (
                <div key={zona || `zona-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <Typography variant="small" color="blue" className="font-bold">
                        {index + 1}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="small" className="font-medium">
                        {zona || 'Sin zona especificada'}
                      </Typography>
                    </div>
                  </div>
                  <Typography variant="small" color="gray">
                    {total} cliente{total !== 1 ? 's' : ''}
                  </Typography>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Distribución por Tipo de Cliente */}
        <Card>
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <Typography variant="h6" color="blue-gray">
              Distribución por Tipo de Cliente
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {por_tipo.map(({ tipo_cliente, total }) => (
                <div key={tipo_cliente}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      {tipo_cliente === 'COMUN' ? (
                        <UserCircleIcon className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <BuildingOffice2Icon className="h-5 w-5 text-pink-500" />
                      )}
                      <Typography variant="small" className="font-medium">
                        {getTipoClienteLabel(tipo_cliente)}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{total}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(tipo_cliente)}`}>
                        {((total / resumen.total_clientes) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(total / resumen.total_clientes) * 100} 
                    color={tipo_cliente === 'COMUN' ? 'indigo' : 'pink'}
                    size="lg"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Distribución por Cobertura */}
        <Card>
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <Typography variant="h6" color="blue-gray">
              Distribución por Cobertura
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {por_cobertura.map(({ cobertura, total }) => (
                <div key={cobertura}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      {cobertura === 'CON_COBERTURA' ? (
                        <ShieldCheckIcon className="h-5 w-5 text-cyan-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-gray-500" />
                      )}
                      <Typography variant="small" className="font-medium">
                        {getCoberturaLabel(cobertura)}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{total}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(cobertura)}`}>
                        {((total / resumen.total_clientes) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(total / resumen.total_clientes) * 100} 
                    color={cobertura === 'CON_COBERTURA' ? 'cyan' : 'gray'}
                    size="lg"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default EstadisticasPanel;