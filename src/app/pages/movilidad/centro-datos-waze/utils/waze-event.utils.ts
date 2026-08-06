export interface WazeEventPresentation {
  label: string;
  category: string;
  color: string;
  icon: string;
}

const eventDictionary:
  Record<string, WazeEventPresentation> = {

  HAZARD: {
    label: 'Peligro en la vía',
    category: 'Peligro',
    color: '#ef4444',
    icon: '⚠️'
  },

  HAZARD_ON_ROAD: {
    label: 'Peligro sobre la vía',
    category: 'Peligro',
    color: '#ef4444',
    icon: '⚠️'
  },

  HAZARD_ON_ROAD_POT_HOLE: {
    label: 'Hueco en la vía',
    category: 'Daño vial',
    color: '#dc2626',
    icon: '⚠️'
  },

  HAZARD_ON_ROAD_CONSTRUCTION: {
    label: 'Obras en la vía',
    category: 'Obra vial',
    color: '#f97316',
    icon: '🚧'
  },

  HAZARD_ON_ROAD_LANE_CLOSED: {
    label: 'Carril cerrado',
    category: 'Cierre vial',
    color: '#7c3aed',
    icon: '⛔'
  },

  HAZARD_ON_ROAD_OBJECT: {
    label: 'Objeto sobre la vía',
    category: 'Peligro',
    color: '#ea580c',
    icon: '⚠️'
  },

  HAZARD_ON_ROAD_TRAFFIC_LIGHT_FAULT: {
    label: 'Semáforo fuera de servicio',
    category: 'Semaforización',
    color: '#eab308',
    icon: '🚦'
  },

  HAZARD_ON_ROAD_ICE: {
    label: 'Superficie resbaladiza',
    category: 'Condición vial',
    color: '#38bdf8',
    icon: '❄️'
  },

  HAZARD_ON_ROAD_OIL: {
    label: 'Derrame sobre la vía',
    category: 'Peligro',
    color: '#92400e',
    icon: '⚠️'
  },

  HAZARD_ON_SHOULDER: {
    label: 'Novedad en la berma',
    category: 'Peligro',
    color: '#d97706',
    icon: '⚠️'
  },

  HAZARD_ON_SHOULDER_CAR_STOPPED: {
    label: 'Vehículo detenido en la berma',
    category: 'Vehículo detenido',
    color: '#2563eb',
    icon: '🚗'
  },

  HAZARD_ON_SHOULDER_ANIMALS: {
    label: 'Animales cerca de la vía',
    category: 'Peligro',
    color: '#65a30d',
    icon: '🐾'
  },

  HAZARD_WEATHER: {
    label: 'Riesgo por condiciones climáticas',
    category: 'Clima',
    color: '#0284c7',
    icon: '🌧️'
  },

  ACCIDENT: {
    label: 'Accidente de tránsito',
    category: 'Accidente',
    color: '#be123c',
    icon: '🚑'
  },

  ACCIDENT_MINOR: {
    label: 'Accidente menor',
    category: 'Accidente',
    color: '#e11d48',
    icon: '🚑'
  },

  ACCIDENT_MAJOR: {
    label: 'Accidente grave',
    category: 'Accidente',
    color: '#881337',
    icon: '🚑'
  },

  ROAD_CLOSED: {
    label: 'Vía cerrada',
    category: 'Cierre vial',
    color: '#7c3aed',
    icon: '⛔'
  },

  ROAD_CLOSED_HAZARD: {
    label: 'Cierre vial por peligro',
    category: 'Cierre vial',
    color: '#6d28d9',
    icon: '⛔'
  },

  JAM: {
    label: 'Congestión vial',
    category: 'Congestión',
    color: '#facc15',
    icon: '🚗'
  },

  CHIT_CHAT: {
    label: 'Reporte ciudadano',
    category: 'Reporte',
    color: '#64748b',
    icon: '💬'
  }
};

export function getWazeEventPresentation(
  type: string | null | undefined,
  subtype?: string | null
): WazeEventPresentation {
  const code =
    subtype?.trim() ||
    type?.trim() ||
    'UNKNOWN';

  const exactMatch =
    eventDictionary[code];

  if (exactMatch) {
    return exactMatch;
  }

  if (code.includes('ACCIDENT')) {
    return eventDictionary['ACCIDENT'];
  }

  if (
    code.includes('ROAD_CLOSED') ||
    code.includes('LANE_CLOSED')
  ) {
    return eventDictionary['ROAD_CLOSED'];
  }

  if (code.includes('CONSTRUCTION')) {
    return eventDictionary[
      'HAZARD_ON_ROAD_CONSTRUCTION'
    ];
  }

  if (code.includes('CAR_STOPPED')) {
    return eventDictionary[
      'HAZARD_ON_SHOULDER_CAR_STOPPED'
    ];
  }

  if (code.includes('POT_HOLE')) {
    return eventDictionary[
      'HAZARD_ON_ROAD_POT_HOLE'
    ];
  }

  if (code.includes('WEATHER')) {
    return eventDictionary['HAZARD_WEATHER'];
  }

  if (code.includes('JAM')) {
    return eventDictionary['JAM'];
  }

  if (code.includes('HAZARD')) {
    return {
      ...eventDictionary['HAZARD'],
      label: humanizeWazeCode(code)
    };
  }

  return {
    label: humanizeWazeCode(code),
    category: 'Evento vial',
    color: '#64748b',
    icon: '📍'
  };
}

export function humanizeWazeCode(
  value: string
): string {
  const cleaned = value
    .replaceAll('_', ' ')
    .trim()
    .toLowerCase();

  if (!cleaned) {
    return 'Evento vial';
  }

  return cleaned.replace(
    /^\p{L}/u,
    (letter) => letter.toUpperCase()
  );
}