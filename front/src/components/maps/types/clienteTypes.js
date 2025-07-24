export const CLIENTE_ESTADOS = {
  PENDIENTE: 'pendiente',
  RECHAZADO: 'rechazado',
  ACTIVO: 'activo'
};

export const TIPO_VIVIENDA = {
  VIVIENDA: 'vivienda',
  DEPARTAMENTO: 'departamento'
};

export const ESTADO_OPTIONS = [
  { value: CLIENTE_ESTADOS.PENDIENTE, label: 'Pendiente', color: 'orange' },
  { value: CLIENTE_ESTADOS.RECHAZADO, label: 'Rechazado', color: 'red' },
  { value: CLIENTE_ESTADOS.ACTIVO, label: 'Activo', color: 'green' }
];

export const TIPO_VIVIENDA_OPTIONS = [
  { value: TIPO_VIVIENDA.VIVIENDA, label: 'Vivienda' },
  { value: TIPO_VIVIENDA.DEPARTAMENTO, label: 'Departamento' }
];