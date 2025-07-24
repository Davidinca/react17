export const formatCliente = (cliente) => {
  return {
    ...cliente,
    nombre_completo: `${cliente.nombre} ${cliente.apellido}`,
    fecha_solicitud_formatted: new Date(cliente.fecha_solicitud).toLocaleDateString('es-ES'),
    estado_badge: ESTADO_OPTIONS.find(option => option.value === cliente.estado),
    tipo_vivienda_label: TIPO_VIVIENDA_OPTIONS.find(option => option.value === cliente.tipo_vivienda)?.label
  };
};

export const formatCoordinates = (lat, lng) => {
  return {
    lat: parseFloat(lat),
    lng: parseFloat(lng)
  };
};

export const formatAddress = (placeResult) => {
  const components = placeResult.address_components;
  let zona = '';
  let calle = '';

  components.forEach(component => {
    const types = component.types;
    if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
      zona = component.long_name;
    }
    if (types.includes('route')) {
      calle = component.long_name;
    }
  });

  return {
    zona: zona || 'Zona no especificada',
    calle: calle || 'Calle no especificada',
    direccion_completa: placeResult.formatted_address,
    latitud: placeResult.geometry.location.lat(),
    longitud: placeResult.geometry.location.lng()
  };
};