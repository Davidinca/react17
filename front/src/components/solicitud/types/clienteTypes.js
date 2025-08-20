// clienteTypes.js actualizado para coincidir con el modelo Django

export const CLIENTE_ESTADOS = {
  PEND_COBERTURA: 'PEND_COBERTURA',
  PEND_EQUIPO: 'PEND_EQUIPO', 
  PEND_INSTALACION: 'PEND_INSTALACION',
  ACTIVO: 'ACTIVO',
  SUSPENDIDO: 'SUSPENDIDO'
};

export const COBERTURA_TIPOS = {
  CON_COBERTURA: 'CON_COBERTURA',
  SIN_COBERTURA: 'SIN_COBERTURA'
};

export const TIPO_CLIENTE = {
  COMUN: 'COMUN',
  EMPRESA: 'EMPRESA'
};

export const TIPO_VIVIENDA = {
  CASA: 'Casa',
  DEPARTAMENTO: 'Departamento'
};

// Opciones para selects con colores y labels
export const ESTADO_OPTIONS = [
  { 
    value: CLIENTE_ESTADOS.PEND_COBERTURA, 
    label: 'Pendiente por cobertura', 
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800'
  },
  { 
    value: CLIENTE_ESTADOS.PEND_EQUIPO, 
    label: 'Pendiente por equipo', 
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  { 
    value: CLIENTE_ESTADOS.PEND_INSTALACION, 
    label: 'Pendiente por instalación', 
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  },
  { 
    value: CLIENTE_ESTADOS.ACTIVO, 
    label: 'Activo', 
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  { 
    value: CLIENTE_ESTADOS.SUSPENDIDO, 
    label: 'Suspendido', 
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  }
];

export const COBERTURA_OPTIONS = [
  { 
    value: COBERTURA_TIPOS.CON_COBERTURA, 
    label: 'Con cobertura',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  { 
    value: COBERTURA_TIPOS.SIN_COBERTURA, 
    label: 'Sin cobertura',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  }
];

export const TIPO_CLIENTE_OPTIONS = [
  { 
    value: TIPO_CLIENTE.COMUN, 
    label: 'Usuario común',
    icon: '👤'
  },
  { 
    value: TIPO_CLIENTE.EMPRESA, 
    label: 'Empresa',
    icon: '🏢'
  }
];

export const TIPO_VIVIENDA_OPTIONS = [
  { 
    value: TIPO_VIVIENDA.CASA, 
    label: 'Casa',
    icon: '🏠'
  },
  { 
    value: TIPO_VIVIENDA.DEPARTAMENTO, 
    label: 'Departamento',
    icon: '🏢'
  }
];

// Funciones auxiliares para obtener información de los estados
export const getEstadoInfo = (estado) => {
  return ESTADO_OPTIONS.find(option => option.value === estado) || {
    value: estado,
    label: estado,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800'
  };
};

export const getCoberturaInfo = (cobertura) => {
  return COBERTURA_OPTIONS.find(option => option.value === cobertura) || {
    value: cobertura,
    label: cobertura,
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800'
  };
};

export const getTipoClienteInfo = (tipoCliente) => {
  return TIPO_CLIENTE_OPTIONS.find(option => option.value === tipoCliente) || {
    value: tipoCliente,
    label: tipoCliente,
    icon: '❓'
  };
};

export const getTipoViviendaInfo = (tipoVivienda) => {
  return TIPO_VIVIENDA_OPTIONS.find(option => option.value === tipoVivienda) || {
    value: tipoVivienda,
    label: tipoVivienda,
    icon: '🏘️'
  };
};

// Validaciones
export const isEstadoValido = (estado) => {
  return Object.values(CLIENTE_ESTADOS).includes(estado);
};

export const isCoberturaValida = (cobertura) => {
  return Object.values(COBERTURA_TIPOS).includes(cobertura);
};

export const isTipoClienteValido = (tipoCliente) => {
  return Object.values(TIPO_CLIENTE).includes(tipoCliente);
};

export const isTipoViviendaValido = (tipoVivienda) => {
  return Object.values(TIPO_VIVIENDA).includes(tipoVivienda);
};

// Estados que requieren campos adicionales
export const ESTADOS_QUE_REQUIEREN_OBSERVACIONES = [
  CLIENTE_ESTADOS.SUSPENDIDO
];

// Estados en los que el cliente puede cambiar de plan
export const ESTADOS_CAMBIO_PLAN_PERMITIDO = [
  CLIENTE_ESTADOS.ACTIVO
];

// Estados que indican que el cliente está en proceso
export const ESTADOS_EN_PROCESO = [
  CLIENTE_ESTADOS.PEND_COBERTURA,
  CLIENTE_ESTADOS.PEND_EQUIPO,
  CLIENTE_ESTADOS.PEND_INSTALACION
];