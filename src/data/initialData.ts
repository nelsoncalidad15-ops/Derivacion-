import { AppData, Pregunta, Opcion, Configuracion } from '../types';

export const DEFAULT_CONFIG: Configuracion = {
  GOOGLE_SHEET_ID: '',
  NOMBRE_CONCESIONARIO: 'Autosol',
  UMBRAL_DIFERENCIA: 2,
  ANIO_CORTE_USADO: 2016,
  KM_CORTE_USADO: 100000,
};

export const INITIAL_PREGUNTAS: Pregunta[] = [
  {
    id: 'step_0',
    orden: 0,
    pregunta: '¿Ya sabe qué modalidad quiere consultar?',
    ayuda: 'Si ya tiene definido el canal, puede derivar directamente.',
    tipo: 'ACCESO_RAPIDO',
    condicion: '',
    activa: true,
  },
  {
    id: 'step_1',
    orden: 1,
    pregunta: '¿Tiene actualmente un vehículo?',
    ayuda: 'Permite evaluar si interviene un vehículo en la operación.',
    tipo: 'STANDARD',
    condicion: '',
    activa: true,
  },
  {
    id: 'step_2b',
    orden: 2,
    pregunta: '¿Tiene pensado entregar su vehículo?',
    ayuda: 'Para evaluar la toma de su usado como parte de pago.',
    tipo: 'STANDARD',
    condicion: 'TIENE_VEHICULO',
    activa: true,
  },
  {
    id: 'step_3b',
    orden: 3,
    pregunta: '¿Cuántos kilómetros tiene aproximadamente?',
    ayuda: 'Venta Directa toma unidades de hasta 100.000 km.',
    tipo: 'STANDARD',
    condicion: 'ENTREGAR_USADO',
    activa: true,
  },
  {
    id: 'step_2a',
    orden: 4,
    pregunta: '¿Cuándo le gustaría tener su próximo vehículo?',
    ayuda: 'El plazo define la disponibilidad inmediata o la programación en cuotas.',
    tipo: 'STANDARD',
    condicion: '',
    activa: true,
  },
  {
    id: 'step_3a',
    orden: 5,
    pregunta: '¿Cómo imagina realizar la operación?',
    ayuda: 'Disponibilidad de fondos y modalidad de pago contemplada.',
    tipo: 'STANDARD',
    condicion: '',
    activa: true,
  },
  {
    id: 'step_4a',
    orden: 6,
    pregunta: '¿Qué es más importante para usted?',
    ayuda: 'Prioridad principal respecto a tiempos y modalidad de cuota.',
    tipo: 'STANDARD',
    condicion: '',
    activa: true,
  },
  {
    id: 'step_desempate_1',
    orden: 7,
    pregunta: '¿Cómo adquirió su vehículo actual?',
    ayuda: 'Desempate por experiencia previa.',
    tipo: 'STANDARD',
    condicion: 'DESEMPATE',
    activa: true,
  },
  {
    id: 'step_desempate_2',
    orden: 8,
    pregunta: '¿Le gustaría repetir la misma modalidad?',
    ayuda: 'Preferencia de continuidad o cambio de modalidad.',
    tipo: 'STANDARD',
    condicion: 'DESEMPATE_REPETIR',
    activa: true,
  },
];

export const INITIAL_OPCIONES: Opcion[] = [
  // STEP 0: ¿Ya sabe qué modalidad quiere consultar?
  {
    pregunta_id: 'step_0',
    opcion_id: 'o_step0_directa',
    texto: 'Venta tradicional / financiación',
    ayuda: 'Compra convencional (contado, usado y/o crédito).',
    puntos_directa: 0,
    puntos_planes: 0,
    canal_directo: 'VENTA DIRECTA',
  },
  {
    pregunta_id: 'step_0',
    opcion_id: 'o_step0_planes',
    texto: 'Plan de Ahorro',
    ayuda: 'Modalidad de ahorro previo en cuotas accesibles.',
    puntos_directa: 0,
    puntos_planes: 0,
    canal_directo: 'PLANES DE AHORRO',
  },
  {
    pregunta_id: 'step_0',
    opcion_id: 'o_step0_orientar',
    texto: 'No sé / quiero orientación',
    ayuda: 'Inicia el cuestionario rápido para orientar la compra.',
    puntos_directa: 0,
    puntos_planes: 0,
    canal_directo: 'ORIENTAR',
  },

  // STEP 1: ¿Tiene actualmente un vehículo?
  {
    pregunta_id: 'step_1',
    opcion_id: 'o_step1_si',
    texto: 'Sí',
    ayuda: 'Cuenta con vehículo propio actualmente.',
    puntos_directa: 0,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_1',
    opcion_id: 'o_step1_no',
    texto: 'No',
    ayuda: 'No cuenta con vehículo propio actualmente.',
    puntos_directa: 0,
    puntos_planes: 0,
  },

  // STEP 2B: ¿Tiene pensado entregar su vehículo?
  {
    pregunta_id: 'step_2b',
    opcion_id: 'o_step2b_si',
    texto: 'Sí',
    ayuda: 'Interés en entregar el vehículo como parte de pago.',
    puntos_directa: 0,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_2b',
    opcion_id: 'o_step2b_no',
    texto: 'No',
    ayuda: 'Conservará el vehículo o lo venderá de forma particular.',
    puntos_directa: 0,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_2b',
    opcion_id: 'o_step2b_nose',
    texto: 'Todavía no lo sé',
    ayuda: 'Sin definición sobre entregar el usado.',
    puntos_directa: 0,
    puntos_planes: 0,
  },

  // STEP 3B: ¿Cuántos kilómetros tiene aproximadamente?
  {
    pregunta_id: 'step_3b',
    opcion_id: 'o_step3b_hasta100',
    texto: 'Hasta 100.000 km',
    ayuda: 'Venta Directa recibe la unidad como parte de pago.',
    puntos_directa: 1,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_3b',
    opcion_id: 'o_step3b_mas100',
    texto: 'Más de 100.000 km',
    ayuda: 'Regla clave: superar los 100.000 km deriva a Planes de Ahorro.',
    puntos_directa: 0,
    puntos_planes: 99, // Regla fuerte
  },
  {
    pregunta_id: 'step_3b',
    opcion_id: 'o_step3b_nose',
    texto: 'No sabe',
    ayuda: 'Continuar y validar después con el asesor.',
    puntos_directa: 0,
    puntos_planes: 0,
  },

  // STEP 2A: ¿Cuándo le gustaría tener su próximo vehículo?
  {
    pregunta_id: 'step_2a',
    opcion_id: 'o_step2a_inmediato',
    texto: 'Este mes / lo antes posible',
    ayuda: 'Retiro en el corto plazo.',
    puntos_directa: 2,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_2a',
    opcion_id: 'o_step2a_meses',
    texto: 'Puedo esperar algunos meses',
    ayuda: 'Planificación sin urgencia inmediata.',
    puntos_directa: 0,
    puntos_planes: 2,
  },
  {
    pregunta_id: 'step_2a',
    opcion_id: 'o_step2a_nose',
    texto: 'Todavía no lo sé',
    ayuda: 'Sin fecha definida.',
    puntos_directa: 0,
    puntos_planes: 0,
  },

  // STEP 3A: ¿Cómo imagina realizar la operación?
  {
    pregunta_id: 'step_3a',
    opcion_id: 'o_step3a_dinero',
    texto: 'Tengo dinero para una entrega ahora',
    ayuda: 'Disponibilidad de anticipo o contado.',
    puntos_directa: 2,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_3a',
    opcion_id: 'o_step3a_saldo',
    texto: 'Quiero realizar una entrega y financiar el saldo',
    ayuda: 'Entrega inicial y crédito tradicional.',
    puntos_directa: 2,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_3a',
    opcion_id: 'o_step3a_cuotas',
    texto: 'Prefiero comenzar pagando cuotas y realizar una entrega más adelante',
    ayuda: 'Aporte progresivo en cuotas accesibles.',
    puntos_directa: 0,
    puntos_planes: 2,
  },
  {
    pregunta_id: 'step_3a',
    opcion_id: 'o_step3a_nose',
    texto: 'Todavía no lo sé',
    ayuda: 'Para evaluar alternativas con el asesor.',
    puntos_directa: 0,
    puntos_planes: 0,
  },

  // STEP 4A: ¿Qué es más importante para usted?
  {
    pregunta_id: 'step_4a',
    opcion_id: 'o_step4a_rapido',
    texto: 'Retirar el vehículo lo antes posible',
    ayuda: 'Prioridad máxima de entrega.',
    puntos_directa: 2,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_4a',
    opcion_id: 'o_step4a_cuota',
    texto: 'Poder comenzar con una cuota y puedo esperar',
    ayuda: 'Prioridad en cuotas accesibles.',
    puntos_directa: 0,
    puntos_planes: 2,
  },
  {
    pregunta_id: 'step_4a',
    opcion_id: 'o_step4a_ambas',
    texto: 'Quiero conocer ambas alternativas',
    ayuda: 'Interés en comparar ambos canales.',
    puntos_directa: 0,
    puntos_planes: 0,
  },

  // DESEMPATE 1: ¿Cómo adquirió su vehículo actual?
  {
    pregunta_id: 'step_desempate_1',
    opcion_id: 'o_des1_tradicional',
    texto: 'Venta tradicional',
    ayuda: 'Contado, crédito o usado.',
    puntos_directa: 0,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_desempate_1',
    opcion_id: 'o_des1_plan',
    texto: 'Plan de Ahorro',
    ayuda: 'Cuotas de ahorro previo.',
    puntos_directa: 0,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_desempate_1',
    opcion_id: 'o_des1_usado',
    texto: 'Compró un usado',
    ayuda: 'Particular o agencia.',
    puntos_directa: 0,
    puntos_planes: 0,
  },

  // DESEMPATE 2: ¿Le gustaría repetir la misma modalidad?
  {
    pregunta_id: 'step_desempate_2',
    opcion_id: 'o_des2_si',
    texto: 'Sí',
    ayuda: 'Continuar con el mismo canal.',
    puntos_directa: 0,
    puntos_planes: 0,
  },
  {
    pregunta_id: 'step_desempate_2',
    opcion_id: 'o_des2_no',
    texto: 'No',
    ayuda: 'Probar la alternativa contraria.',
    puntos_directa: 0,
    puntos_planes: 0,
  },
];

export const INITIAL_APP_DATA: AppData = {
  preguntas: INITIAL_PREGUNTAS,
  opciones: INITIAL_OPCIONES,
  configuracion: DEFAULT_CONFIG,
  origenDatos: 'DEMO',
  ultimaActualizacion: new Date(),
};
