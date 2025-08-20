import { TIPO_VIVIENDA_OPTIONS } from '../types/clienteTypes';

const TIPO_VIVIENDA = TIPO_VIVIENDA_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.value;
  return acc;
}, {});

export const validateCliente = (cliente) => {
  const errors = {};

  // Validaciones básicas
  if (!cliente.nombre?.trim()) {
    errors.nombre = 'El nombre es requerido';
  }

  if (!cliente.apellido?.trim()) {
    errors.apellido = 'El apellido es requerido';
  }

  // Validación email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cliente.email?.trim()) {
    errors.email = 'El email es requerido';
  } else if (!emailRegex.test(cliente.email)) {
    errors.email = 'El email no es válido';
  }

  // Validación teléfono
  const phoneRegex = /^\+?1?\d{9,15}$/;
  if (!cliente.telefono?.trim()) {
    errors.telefono = 'El teléfono es requerido';
  } else if (!phoneRegex.test(cliente.telefono.replace(/\s/g, ''))) {
    errors.telefono = 'El teléfono debe tener entre 9 y 15 dígitos';
  }

  // Validación CI
  if (!cliente.ci?.trim()) {
    errors.ci = 'El CI es requerido';
  }

  // Validación tipo vivienda
  if (!cliente.tipo_vivienda) {
    errors.tipo_vivienda = 'El tipo de vivienda es requerido';
  }

  // Validación piso para departamentos
  if (cliente.tipo_vivienda === TIPO_VIVIENDA.DEPARTAMENTO && !cliente.piso?.trim()) {
    errors.piso = 'El piso es requerido para departamentos';
  }

  // Validaciones de ubicación
  if (!cliente.zona?.trim()) {
    errors.zona = 'La zona es requerida';
  }

  if (!cliente.calle?.trim()) {
    errors.calle = 'La calle es requerida';
  }

  if (!cliente.direccion_completa?.trim()) {
    errors.direccion_completa = 'La dirección completa es requerida';
  }

  if (!cliente.latitud || !cliente.longitud) {
    errors.ubicacion = 'Las coordenadas son requeridas';
  }

  if (!cliente.tipo_servicio) {
    errors.tipo_servicio = 'El tipo de servicio es requerido';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
