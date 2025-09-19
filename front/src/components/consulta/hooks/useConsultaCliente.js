import { useState } from 'react';
import { consultaApi } from '../api/consultaApi';

export const useConsultaCliente = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progreso, setProgreso] = useState(0);
  const [pasoActual, setPasoActual] = useState(0);
  const [resultados, setResultados] = useState({
    cliente: null,
    servicios: null,
    facturas: null,
    resumen: null
  });

  const pasos = [
    { nombre: 'Buscando cliente', descripcion: 'Consultando datos del cliente...' },
    { nombre: 'Obteniendo servicios', descripcion: 'Migrando servicios del cliente...' },
    { nombre: 'Procesando facturas', descripcion: 'Migrando facturas de todos los contratos...' },
    { nombre: 'Generando resumen', descripcion: 'Preparando resumen final...' }
  ];

  const ejecutarConsultaCompleta = async (nroDocumento) => {
    setLoading(true);
    setError(null);
    setProgreso(0);
    setPasoActual(0);

    try {
      // Paso 1: Consultar cliente
      setPasoActual(0);
      setProgreso(25);
      const clienteResult = await consultaApi.consultarCliente(nroDocumento);
      
      if (clienteResult.status === 'no_encontrado') {
        throw new Error('Cliente no encontrado');
      }

      const codCliente = clienteResult.data?.cod_cliente || clienteResult.cod_cliente;
      setResultados(prev => ({ ...prev, cliente: clienteResult }));

      // Paso 2: Consultar servicios
      setPasoActual(1);
      setProgreso(50);
      const serviciosResult = await consultaApi.consultarServicios(codCliente);
      setResultados(prev => ({ ...prev, servicios: serviciosResult }));

      // Paso 3: Consultar facturas
      setPasoActual(2);
      setProgreso(75);
      const facturasResult = await consultaApi.consultarFacturas(codCliente);
      setResultados(prev => ({ ...prev, facturas: facturasResult }));

      // Paso 4: Obtener resumen final
      setPasoActual(3);
      setProgreso(100);
      const resumenResult = await consultaApi.obtenerResumenCliente(nroDocumento);
      setResultados(prev => ({ ...prev, resumen: resumenResult }));

      setLoading(false);
      return resumenResult;

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error en la consulta');
      setLoading(false);
      throw err;
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setProgreso(0);
    setPasoActual(0);
    setResultados({
      cliente: null,
      servicios: null,
      facturas: null,
      resumen: null
    });
  };

  return {
    loading,
    error,
    progreso,
    pasoActual,
    pasos,
    resultados,
    ejecutarConsultaCompleta,
    reset
  };
};