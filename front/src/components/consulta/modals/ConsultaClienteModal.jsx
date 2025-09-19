import React, { useState } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Input,
  Progress,
  Typography,
  Alert,
  Card,
  CardBody,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel
} from '@material-tailwind/react';
import { CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { useConsultaCliente } from '../hooks/useConsultaCliente';
import { consultaApi } from '../api/consultaApi';
import ResumenCliente from '../components/ResumenCliente';

const ConsultaClienteModal = ({ open, onClose }) => {
  const [nroDocumento, setNroDocumento] = useState('');
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [modoActivo, setModoActivo] = useState("consulta");
  
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [errorResumen, setErrorResumen] = useState(null);
  const [datosResumen, setDatosResumen] = useState(null);

  const {
    loading,
    error,
    progreso,
    pasoActual,
    pasos,
    resultados,
    ejecutarConsultaCompleta,
    reset
  } = useConsultaCliente();

  const handleConsultar = async () => {
    if (!nroDocumento.trim()) return;
    try {
      setMostrarResumen(false);
      await ejecutarConsultaCompleta(nroDocumento.trim());
      setMostrarResumen(true);
    } catch (error) {
      console.error('Error en consulta:', error);
    }
  };

  const handleObtenerResumen = async () => {
    if (!nroDocumento.trim()) return;
    setLoadingResumen(true);
    setErrorResumen(null);
    setDatosResumen(null);

    try {
      const resultado = await consultaApi.obtenerResumenCliente(nroDocumento.trim());
      setDatosResumen(resultado);
    } catch (error) {
      if (error.response?.status === 404) {
        setErrorResumen('Cliente no encontrado en datos locales. Use "Consulta Completa" para migrar los datos.');
      } else {
        setErrorResumen(error.response?.data?.error || 'Error al obtener resumen del cliente');
      }
    } finally {
      setLoadingResumen(false);
    }
  };

  const handleClose = () => {
    reset();
    setNroDocumento('');
    setMostrarResumen(false);
    setDatosResumen(null);
    setErrorResumen(null);
    setModoActivo("consulta");
    onClose();
  };

  const handleNuevaConsulta = () => {
    reset();
    setNroDocumento('');
    setMostrarResumen(false);
    setDatosResumen(null);
    setErrorResumen(null);
  };

  return (
    <Dialog 
      open={open} 
      handler={handleClose} 
      size="xl" // Cambiado de "lg" a "xl" para más espacio
      className="min-h-[700px]" // Aumentado el altura mínima
    >
      <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <DocumentMagnifyingGlassIcon className="h-8 w-8" />
          <div>
            <Typography variant="h3" color="white">
              Consulta de Cliente
            </Typography>
            <Typography variant="small" color="blue-gray" className="text-blue-100 opacity-80">
              Sistema de consulta y migración de datos
            </Typography>
          </div>
        </div>
      </DialogHeader>

      <DialogBody className="p-8 max-h-[75vh] overflow-y-auto bg-gray-50">
        {/* Campo de documento - Más grande y destacado */}
        <div className="mb-8">
          <Card className="shadow-lg border-0">
            <CardBody className="p-8">
  <div className="text-center mb-6">
    <Typography variant="h5" color="blue-gray" className="mb-2 font-bold">
      Ingrese el número de documento del cliente
    </Typography>
    <Typography variant="small" color="gray" className="opacity-70">
      Introduzca el documento de identidad para buscar la información del cliente
    </Typography>
  </div>
  <Input
    size="lg"
    label="Número de Documento"
    value={nroDocumento}
    onChange={(e) => setNroDocumento(e.target.value)}
    disabled={loading || loadingResumen}
    placeholder="Ej: 4819716"
    className="text-xl !py-4"
    labelProps={{
      className: "text-base"
    }}
    containerProps={{
      className: "min-w-0 !h-16"
    }}
  />
</CardBody>
          </Card>
        </div>

        {/* Tabs mejorados */}
        <Tabs value={modoActivo} onChange={setModoActivo}>
          <Card className="shadow-lg">
            <CardBody className="p-0">
              <TabsHeader className="bg-gray-100 p-1 m-2">
                <Tab value="consulta" className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <DocumentMagnifyingGlassIcon className="h-6 w-6" />
                    <div className="text-left">
                      <Typography variant="h6">Consulta Completa</Typography>
                      <Typography variant="small" className="opacity-70">
                        Migra datos si no existen
                      </Typography>
                    </div>
                  </div>
                </Tab>
                <Tab value="resumen" className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <MagnifyingGlassIcon className="h-6 w-6" />
                    <div className="text-left">
                      <Typography variant="h6">Ver Resumen</Typography>
                      <Typography variant="small" className="opacity-70">
                        Solo datos locales
                      </Typography>
                    </div>
                  </div>
                </Tab>
              </TabsHeader>

              <TabsBody className="p-6">
                {/* TAB: Consulta Completa */}
                <TabPanel value="consulta" className="p-0">
                  {!mostrarResumen ? (
                    <div className="space-y-6">
                      <Alert 
                        color="blue" 
                        className="text-base py-4"
                        icon={<DocumentMagnifyingGlassIcon className="h-6 w-6" />}
                      >
                        <div>
                          <Typography className="font-semibold mb-1">
                            Consulta Completa
                          </Typography>
                          <Typography className="text-sm opacity-90">
                            Busca y migra datos del cliente desde el sistema externo si no existen localmente. 
                            Incluye información del cliente, servicios activos y facturas pendientes.
                          </Typography>
                        </div>
                      </Alert>
                      
                      {!loading && (
                        <Button 
                          onClick={handleConsultar}
                          disabled={!nroDocumento.trim()}
                          color="blue"
                          size="lg"
                          className="w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
                        >
                          Ejecutar Consulta Completa
                        </Button>
                      )}

                      {/* Progreso mejorado */}
                      {loading && (
                        <Card className="shadow-lg border-l-4 border-l-blue-500">
                          <CardBody className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              <Typography variant="h5" color="blue-gray">
                                Procesando consulta...
                              </Typography>
                            </div>
                            
                            <Progress 
                              value={progreso} 
                              color="blue"
                              className="h-4 mb-6"
                            />
                            
                            <div className="space-y-4">
                              {pasos.map((paso, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                                  {index < pasoActual ? (
                                    <CheckCircleIcon className="h-7 w-7 text-green-500 flex-shrink-0" />
                                  ) : index === pasoActual ? (
                                    <div className="h-7 w-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                  ) : (
                                    <div className="h-7 w-7 border-2 border-gray-300 rounded-full flex-shrink-0" />
                                  )}
                                  <div>
                                    <Typography 
                                      variant="h6"
                                      color={index <= pasoActual ? "blue-gray" : "gray"}
                                      className={index === pasoActual ? "font-bold" : ""}
                                    >
                                      {paso.nombre}
                                    </Typography>
                                    <Typography variant="small" color="gray">
                                      {paso.descripcion}
                                    </Typography>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardBody>
                        </Card>
                      )}

                      {error && (
                        <Alert 
                          color="red" 
                          icon={<XCircleIcon className="h-6 w-6" />}
                          className="text-base py-4"
                        >
                          <Typography className="font-semibold">Error en la consulta</Typography>
                          <Typography className="text-sm mt-1">{error}</Typography>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <CheckCircleIcon className="h-8 w-8 text-green-600" />
                          <div>
                            <Typography variant="h5" color="green">
                              Consulta completada exitosamente
                            </Typography>
                            <Typography variant="small" color="gray">
                              Todos los datos han sido migrados correctamente
                            </Typography>
                          </div>
                        </div>
                        <Button
                          variant="outlined"
                          color="green"
                          onClick={handleNuevaConsulta}
                          className="font-semibold"
                        >
                          Nueva Consulta
                        </Button>
                      </div>
                      
                      <ResumenCliente 
                        datos={resultados.resumen}
                        resultadosMigracion={{
                          cliente: resultados.cliente,
                          servicios: resultados.servicios,
                          facturas: resultados.facturas
                        }}
                      />
                    </div>
                  )}
                </TabPanel>

                {/* TAB: Solo Resumen */}
                <TabPanel value="resumen" className="p-0">
                  <div className="space-y-6">
                    <Alert 
                      color="amber" 
                      className="text-base py-4"
                      icon={<MagnifyingGlassIcon className="h-6 w-6" />}
                    >
                      <div>
                        <Typography className="font-semibold mb-1">
                          Ver Resumen de Deudas
                        </Typography>
                        <Typography className="text-sm opacity-90">
                          Consulta únicamente datos ya migrados en el sistema local. 
                          Si no existen datos, use "Consulta Completa" primero.
                        </Typography>
                      </div>
                    </Alert>

                    {!loadingResumen && !datosResumen && (
                      <Button 
                        onClick={handleObtenerResumen}
                        disabled={!nroDocumento.trim()}
                        color="green"
                        size="lg"
                        className="w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
                      >
                        Ver Resumen de Deudas
                      </Button>
                    )}

                    {loadingResumen && (
                      <Card className="shadow-lg border-l-4 border-l-green-500">
                        <CardBody className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="h-12 w-12 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <Typography variant="h6" color="green">
                              Consultando resumen...
                            </Typography>
                            <Typography variant="small" color="gray">
                              Obteniendo información de deudas
                            </Typography>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {errorResumen && (
                      <Alert 
                        color="red" 
                        icon={<XCircleIcon className="h-6 w-6" />}
                        className="text-base py-4"
                      >
                        <Typography className="font-semibold">Error en la consulta</Typography>
                        <Typography className="text-sm mt-1">{errorResumen}</Typography>
                      </Alert>
                    )}

                    {datosResumen && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <CheckCircleIcon className="h-8 w-8 text-green-600" />
                            <div>
                              <Typography variant="h5" color="green">
                                Resumen obtenido
                              </Typography>
                              <Typography variant="small" color="gray">
                                Información de deudas actualizada
                              </Typography>
                            </div>
                          </div>
                          <Button
                            variant="outlined"
                            color="green"
                            onClick={() => setDatosResumen(null)}
                            className="font-semibold"
                          >
                            Nueva Consulta
                          </Button>
                        </div>
                        
                        <ResumenCliente 
                          datos={datosResumen}
                          soloResumen={true}
                        />
                      </div>
                    )}
                  </div>
                </TabPanel>
              </TabsBody>
            </CardBody>
          </Card>
        </Tabs>
      </DialogBody>

      <DialogFooter className="bg-gray-50 p-6">
        <Button 
          variant="outlined" 
          onClick={handleClose}
          size="lg"
          className="font-semibold"
        >
          {(mostrarResumen || datosResumen) ? 'Cerrar' : 'Cancelar'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ConsultaClienteModal;