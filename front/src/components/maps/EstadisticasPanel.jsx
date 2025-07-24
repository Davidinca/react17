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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { clienteService, tipoServicioService } from './services/apiService';

const EstadisticasPanel = ({ refreshTrigger }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEstadisticas();
  }, [refreshTrigger]);

  const loadEstadisticas = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, clientesData, tiposData] = await Promise.all([
        clienteService.getEstadisticas(),
        clienteService.getAll(),
        tipoServicioService.getAll()
      ]);

      setEstadisticas(statsData);
      setClientes(clientesData);
      setTiposServicio(tiposData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getZonaStats = () => {
    const zonaCount = {};
    clientes.forEach(cliente => {
      const zona = cliente.zona || 'Sin zona';
      zonaCount[zona] = (zonaCount[zona] || 0) + 1;
    });
    
    return Object.entries(zonaCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getTipoViviendaStats = () => {
    const viviendaCount = { vivienda: 0, departamento: 0 };
    clientes.forEach(cliente => {
      if (cliente.tipo_vivienda) {
        viviendaCount[cliente.tipo_vivienda]++;
      }
    });
    return viviendaCount;
  };

  const getTipoServicioStats = () => {
    const servicioCount = {};
    clientes.forEach(cliente => {
      const servicio = cliente.tipo_servicio_nombre || 'Sin servicio';
      servicioCount[servicio] = (servicioCount[servicio] || 0) + 1;
    });
    
    return Object.entries(servicioCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getRecentClientes = () => {
    return clientes
      .sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="flex justify-center items-center h-64">
            <Typography>Cargando estadísticas...</Typography>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert color="red">
        Error al cargar estadísticas: {error}
      </Alert>
    );
  }

  const zonaStats = getZonaStats();
  const tipoViviendaStats = getTipoViviendaStats();
  const tipoServicioStats = getTipoServicioStats();
  const recentClientes = getRecentClientes();

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border">
          <CardBody className="text-center">
            <UsersIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <Typography variant="h4" color="blue-gray">
              {estadisticas?.total || 0}
            </Typography>
            <Typography variant="small" color="gray">
              Total Clientes
            </Typography>
          </CardBody>
        </Card>

        <Card className="border">
          <CardBody className="text-center">
            <ClockIcon className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <Typography variant="h4" color="orange">
              {estadisticas?.pendientes || 0}
            </Typography>
            <Typography variant="small" color="gray">
              Pendientes
            </Typography>
          </CardBody>
        </Card>

        <Card className="border">
          <CardBody className="text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <Typography variant="h4" color="green">
              {estadisticas?.activos || 0}
            </Typography>
            <Typography variant="small" color="gray">
              Activos
            </Typography>
          </CardBody>
        </Card>

        <Card className="border">
          <CardBody className="text-center">
            <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <Typography variant="h4" color="red">
              {estadisticas?.rechazados || 0}
            </Typography>
            <Typography variant="small" color="gray">
              Rechazados
            </Typography>
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
              <div>
                <div className="flex justify-between mb-2">
                  <Typography variant="small">Activos</Typography>
                  <Typography variant="small">
                    {estadisticas?.porcentaje_activos || 0}%
                  </Typography>
                </div>
                <Progress 
                  value={estadisticas?.porcentaje_activos || 0} 
                  color="green" 
                  size="lg"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Typography variant="small">Pendientes</Typography>
                  <Typography variant="small">
                    {estadisticas?.total > 0 ? 
                      ((estadisticas?.pendientes / estadisticas?.total) * 100).toFixed(1) : 0}%
                  </Typography>
                </div>
                <Progress 
                  value={estadisticas?.total > 0 ? 
                    (estadisticas?.pendientes / estadisticas?.total) * 100 : 0} 
                  color="orange" 
                  size="lg"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Typography variant="small">Rechazados</Typography>
                  <Typography variant="small">
                    {estadisticas?.total > 0 ? 
                      ((estadisticas?.rechazados / estadisticas?.total) * 100).toFixed(1) : 0}%
                  </Typography>
                </div>
                <Progress 
                  value={estadisticas?.total > 0 ? 
                    (estadisticas?.rechazados / estadisticas?.total) * 100 : 0} 
                  color="red" 
                  size="lg"
                />
              </div>
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
              {zonaStats.map(([zona, count], index) => (
                <div key={zona} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <Typography variant="small" color="blue" className="font-bold">
                        {index + 1}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="small" className="font-medium">
                        {zona}
                      </Typography>
                    </div>
                  </div>
                  <Typography variant="small" color="gray">
                    {count} cliente{count !== 1 ? 's' : ''}
                  </Typography>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Tipo de Vivienda */}
        <Card>
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <Typography variant="h6" color="blue-gray">
              Tipo de Vivienda
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HomeIcon className="h-8 w-8 text-green-500" />
                  <Typography variant="small" className="font-medium">
                    Viviendas
                  </Typography>
                </div>
                <Typography variant="small" color="gray">
                  {tipoViviendaStats.vivienda} cliente{tipoViviendaStats.vivienda !== 1 ? 's' : ''}
                </Typography>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
                  <Typography variant="small" className="font-medium">
                    Departamentos
                  </Typography>
                </div>
                <Typography variant="small" color="gray">
                  {tipoViviendaStats.departamento} cliente{tipoViviendaStats.departamento !== 1 ? 's' : ''}
                </Typography>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Servicios más solicitados */}
        <Card>
          <CardHeader floated={false} shadow={false} className="rounded-none">
            <Typography variant="h6" color="blue-gray">
              Servicios más Solicitados
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {tipoServicioStats.map(([servicio, count], index) => (
                <div key={servicio} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                      <Typography variant="small" color="purple" className="font-bold">
                        {index + 1}
                      </Typography>
                    </div>
                    <Typography variant="small" className="font-medium">
                      {servicio}
                    </Typography>
                  </div>
                  <Typography variant="small" color="gray">
                    {count} solicitud{count !== 1 ? 'es' : ''}
                  </Typography>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Clientes recientes */}
      <Card>
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <Typography variant="h6" color="blue-gray">
            Últimas Solicitudes
          </Typography>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {recentClientes.map((cliente) => (
              <div key={cliente.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                    <Typography variant="small" className="font-bold">
                      {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="small" className="font-medium">
                      {cliente.nombre} {cliente.apellido}
                    </Typography>
                    <Typography variant="small" color="gray">
                      {cliente.zona} - {cliente.email}
                    </Typography>
                  </div>
                </div>
                <div className="text-right">
                  <Typography variant="small" color="gray">
                    {new Date(cliente.fecha_solicitud).toLocaleDateString('es-ES')}
                  </Typography>
                  <Typography variant="small" className={`font-medium ${
                    cliente.estado === 'activo' ? 'text-green-600' :
                    cliente.estado === 'pendiente' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {cliente.estado_display}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default EstadisticasPanel;