import React from 'react';
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Progress
} from '@material-tailwind/react';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  CurrencyDollarIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const ResumenCliente = ({ datos, resultadosMigracion, soloResumen = false }) => {
  const [openAccordion, setOpenAccordion] = React.useState(1);

  const handleAccordionOpen = (value) => {
    setOpenAccordion(openAccordion === value ? 0 : value);
  };

  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(monto || 0);
  };

  // Calcular totales
  const totalFacturas = datos?.servicios?.reduce((total, servicio) => 
    total + (servicio.facturas_resumen?.cantidad_facturas || 0), 0
  ) || 0;

  const totalMonto = datos?.servicios?.reduce((total, servicio) => 
    total + (servicio.facturas_resumen?.total_monto || 0), 0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Información del Cliente - Más grande y visual */}
      <Card className="shadow-xl border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
          <div className="flex items-center gap-4 text-white">
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <Typography variant="h4" color="white" className="font-bold">
                {datos?.cliente?.nombres}
              </Typography>
              <Typography variant="h6" color="white" className="opacity-90">
                Cliente #{datos?.cliente?.cod_cliente}
              </Typography>
            </div>
          </div>
        </div>
        
        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Typography variant="small" color="gray" className="font-medium mb-1">
                Documento
              </Typography>
              <Typography variant="h6" color="blue-gray">
                {datos?.cliente?.nro_documento}
              </Typography>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Typography variant="small" color="gray" className="font-medium mb-1">
                Total Facturas
              </Typography>
              <Typography variant="h6" color="green">
                {totalFacturas}
              </Typography>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <Typography variant="small" color="gray" className="font-medium mb-1">
                Total Adeudado
              </Typography>
              <Typography variant="h6" color="red" className="font-bold">
                {formatearMonto(totalMonto)}
              </Typography>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Estadísticas de Migración - Solo si no es resumen */}
      {!soloResumen && resultadosMigracion && (
        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircleIcon className="h-7 w-7 text-green-600" />
              <Typography variant="h5" color="green">
                Resultados de Migración
              </Typography>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="p-3 bg-blue-500 rounded-full w-fit mx-auto mb-3">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <Typography variant="h4" color="blue" className="font-bold mb-1">
                  {resultadosMigracion?.cliente?.status === 'migrado' ? '1' : '0'}
                </Typography>
                <Typography variant="small" color="gray" className="font-medium">
                  Cliente migrado
                </Typography>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="p-3 bg-green-500 rounded-full w-fit mx-auto mb-3">
                  <PhoneIcon className="h-6 w-6 text-white" />
                </div>
                <Typography variant="h4" color="green" className="font-bold mb-1">
                  {resultadosMigracion?.servicios?.registros || 0}
                </Typography>
                <Typography variant="small" color="gray" className="font-medium">
                  Servicios migrados
                </Typography>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <div className="p-3 bg-orange-500 rounded-full w-fit mx-auto mb-3">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <Typography variant="h4" color="orange" className="font-bold mb-1">
                  {resultadosMigracion?.facturas?.total_facturas || 0}
                </Typography>
                <Typography variant="small" color="gray" className="font-medium">
                  Facturas migradas
                </Typography>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Servicios y Facturas - Mejorado */}
      <Card className="shadow-xl">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <BuildingOfficeIcon className="h-7 w-7 text-blue-600" />
            <Typography variant="h5" color="blue-gray">
              Servicios del Cliente
            </Typography>
          </div>
          
          {datos?.servicios?.length > 0 ? (
            <div className="space-y-4">
              {datos.servicios.map((servicio, index) => (
                <Accordion 
                  key={index} 
                  open={openAccordion === index + 1}
                  className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionHeader 
                    onClick={() => handleAccordionOpen(index + 1)}
                    className="text-base px-6 py-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <Typography variant="h6" className="font-bold">
                            Contrato: {servicio.servicio?.contrato}
                          </Typography>
                          <Typography variant="small" color="gray">
                            {servicio.servicio?.direccion}
                          </Typography>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Chip
                          size="lg"
                          value={`${servicio.facturas_resumen?.cantidad_facturas || 0} facturas`}
                          color="blue"
                          className="rounded-full font-semibold"
                        />
                        <Chip
                          size="lg"
                          value={formatearMonto(servicio.facturas_resumen?.total_monto)}
                          color="red"
                          className="rounded-full font-bold"
                        />
                        <ChevronDownIcon 
                          className={`h-5 w-5 transition-transform ${
                            openAccordion === index + 1 ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </AccordionHeader>
                  
                  <AccordionBody className="px-6 pb-6">
                    <div className="space-y-6">
                      {/* Detalles del servicio */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Typography variant="small" color="gray" className="font-semibold mb-1">
                            Dirección Completa:
                          </Typography>
                          <Typography variant="small">
                            {servicio.servicio?.direccion || 'No especificada'}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="small" color="gray" className="font-semibold mb-1">
                            Plan Comercial:
                          </Typography>
                          <Typography variant="small">
                            {servicio.servicio?.plan_comercial || 'No especificado'}
                          </Typography>
                        </div>
                        <div>
                          <Typography variant="small" color="gray" className="font-semibold mb-1">
                            Estado del Servicio:
                          </Typography>
                          <Chip
                            size="sm"
                            color={servicio.servicio?.anulado ? 'red' : 'green'}
                            value={servicio.servicio?.anulado ? 'Anulado' : 'Activo'}
                            className="w-fit"
                          />
                        </div>
                        <div>
                          <Typography variant="small" color="gray" className="font-semibold mb-1">
                            Código de Servicio:
                          </Typography>
                          <Typography variant="small">
                            {servicio.servicio?.cod_servicio || 'N/A'}
                          </Typography>
                        </div>
                      </div>
                      
                      {/* Resumen de facturas mejorado */}
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-l-4 border-l-red-500">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-red-500 rounded-lg">
                            <CurrencyDollarIcon className="h-6 w-6 text-white" />
                          </div>
                          <Typography variant="h6" className="font-bold text-red-900">
                            Facturas Pendientes de Pago
                          </Typography>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="text-center p-4 bg-white bg-opacity-70 rounded-lg">
                            <Typography variant="small" color="gray" className="font-medium mb-2">
                              Cantidad de Facturas
                            </Typography>
                            <Typography variant="h4" className="font-bold text-red-700">
                              {servicio.facturas_resumen?.cantidad_facturas || 0}
                            </Typography>
                          </div>
                          <div className="text-center p-4 bg-white bg-opacity-70 rounded-lg">
                            <Typography variant="small" color="gray" className="font-medium mb-2">
                              Monto Total Adeudado
                            </Typography>
                            <Typography variant="h4" className="font-bold text-red-700">
                              {formatearMonto(servicio.facturas_resumen?.total_monto)}
                            </Typography>
                          </div>
                        </div>

                        {/* Barra de progreso visual */}
                        {totalMonto > 0 && (
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <Typography variant="small" color="gray">
                                Porcentaje de deuda de este servicio
                              </Typography>
                              <Typography variant="small" className="font-semibold">
                                {(((servicio.facturas_resumen?.total_monto || 0) / totalMonto) * 100).toFixed(1)}%
                              </Typography>
                            </div>
                            <Progress
                              value={((servicio.facturas_resumen?.total_monto || 0) / totalMonto) * 100}
                              color="red"
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionBody>
                </Accordion>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                <DocumentTextIcon className="h-12 w-12 text-gray-400" />
              </div>
              <Typography variant="h6" color="gray">
                No se encontraron servicios
              </Typography>
              <Typography variant="small" color="gray">
                Este cliente no tiene servicios con deudas pendientes
              </Typography>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ResumenCliente;