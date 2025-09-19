import { useState, useCallback } from 'react';
import { consultaApi } from '../api/consultaApi';

export const useBuscarClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buscarPorNombre = useCallback(async (nombre) => {
    if (!nombre || nombre.trim().length < 2) {
      setClientes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resultado = await consultaApi.buscarClientePorNombre(nombre.trim());
      setClientes(resultado);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al buscar clientes');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const listarLocales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const resultado = await consultaApi.listarClientesLocales();
      setClientes(resultado);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al listar clientes');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const limpiar = () => {
    setClientes([]);
    setError(null);
  };

  return {
    clientes,
    loading,
    error,
    buscarPorNombre,
    listarLocales,
    limpiar
  };
};