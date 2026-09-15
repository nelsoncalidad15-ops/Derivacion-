import { Configuracion, Opcion, Pregunta } from '../types';

export function formatPreguntaTexto(pregunta: Pregunta, config?: Configuracion): string {
  if (!pregunta || !pregunta.pregunta) return '';

  const anio = config?.ANIO_CORTE_USADO || 2016;
  const kmFormatted = Number(config?.KM_CORTE_USADO || 100000).toLocaleString('es-AR');

  return pregunta.pregunta
    .replace('{ANIO_CORTE_USADO}', String(anio))
    .replace('{KM_CORTE_USADO}', kmFormatted);
}

export type FlowStepId =
  | 'step_0'
  | 'step_1'
  | 'step_2b'
  | 'step_3b'
  | 'step_2a'
  | 'step_3a'
  | 'step_4a'
  | 'step_desempate_1'
  | 'step_desempate_2';

export interface NextStepDecision {
  nextStepId: FlowStepId | null; // null means finished!
  isImmediateFinish?: boolean;
  canalFinalDirecto?: 'VENTA DIRECTA' | 'PLANES DE AHORRO' | 'AMBAS ALTERNATIVAS';
}

/**
 * Computes current points for Directa vs Planes from given answers
 */
export function calcularPuntosParciales(respuestas: Record<string, Opcion>): { directa: number; planes: number } {
  let directa = 0;
  let planes = 0;

  // Step 3b
  const r3b = respuestas['step_3b'];
  if (r3b) {
    if (r3b.opcion_id === 'o_step3b_hasta100' || r3b.texto.toLowerCase().includes('hasta 100.000')) {
      directa += 1;
    }
  }

  // Step 2a
  const r2a = respuestas['step_2a'];
  if (r2a) {
    if (r2a.opcion_id === 'o_step2a_inmediato' || r2a.texto.toLowerCase().includes('antes posible')) directa += 2;
    if (r2a.opcion_id === 'o_step2a_meses' || r2a.texto.toLowerCase().includes('algunos meses')) planes += 2;
  }

  // Step 3a
  const r3a = respuestas['step_3a'];
  if (r3a) {
    if (r3a.opcion_id === 'o_step3a_dinero' || r3a.opcion_id === 'o_step3a_saldo') directa += 2;
    if (r3a.opcion_id === 'o_step3a_cuotas') planes += 2;
  }

  // Step 4a
  const r4a = respuestas['step_4a'];
  if (r4a) {
    if (r4a.opcion_id === 'o_step4a_rapido') directa += 2;
    if (r4a.opcion_id === 'o_step4a_cuota') planes += 2;
  }

  return { directa, planes };
}

/**
 * Calculates the next step in the flow according to the exact decision tree.
 */
export function obtenerSiguientePaso(
  currentStepId: FlowStepId,
  opcionElegida: Opcion,
  respuestasActualizadas: Record<string, Opcion>
): NextStepDecision {
  // STEP 0: Modalidad conocida o inicio de cuestionario
  if (currentStepId === 'step_0') {
    if (opcionElegida.opcion_id === 'o_step0_directa' || opcionElegida.canal_directo === 'VENTA DIRECTA') {
      return { nextStepId: null, isImmediateFinish: true, canalFinalDirecto: 'VENTA DIRECTA' };
    }
    if (opcionElegida.opcion_id === 'o_step0_planes' || opcionElegida.canal_directo === 'PLANES DE AHORRO') {
      return { nextStepId: null, isImmediateFinish: true, canalFinalDirecto: 'PLANES DE AHORRO' };
    }
    return { nextStepId: 'step_1' };
  }

  // STEP 1: ¿Tiene actualmente un vehículo?
  if (currentStepId === 'step_1') {
    const tieneVehiculo =
      opcionElegida.opcion_id === 'o_step1_si' ||
      opcionElegida.texto.toLowerCase().trim() === 'sí' ||
      opcionElegida.texto.toLowerCase().trim() === 'si';

    if (tieneVehiculo) {
      return { nextStepId: 'step_2b' }; // Ramal Sí -> ¿Tiene pensado entregar su vehículo?
    } else {
      return { nextStepId: 'step_2a' }; // Ramal No -> Directo a ¿Cuándo le gustaría tener su próximo vehículo?
    }
  }

  // STEP 2B: ¿Tiene pensado entregar su vehículo?
  if (currentStepId === 'step_2b') {
    const entregaVehiculo =
      opcionElegida.opcion_id === 'o_step2b_si' ||
      opcionElegida.texto.toLowerCase().trim() === 'sí' ||
      opcionElegida.texto.toLowerCase().trim() === 'si';

    if (entregaVehiculo) {
      return { nextStepId: 'step_3b' }; // ¿Cuántos kilómetros tiene aproximadamente?
    } else {
      return { nextStepId: 'step_2a' }; // No o Todavía no lo sé -> va a STEP 2A
    }
  }

  // STEP 3B: ¿Cuántos kilómetros tiene aproximadamente?
  if (currentStepId === 'step_3b') {
    const supera100k =
      opcionElegida.opcion_id === 'o_step3b_mas100' ||
      opcionElegida.texto.toLowerCase().includes('más de 100.000') ||
      opcionElegida.texto.toLowerCase().includes('mas de 100.000');

    if (supera100k) {
      // Regla clave: si quiere entregar su vehículo y supera los 100.000 km, derivar a PLANES DE AHORRO
      return { nextStepId: null, isImmediateFinish: true, canalFinalDirecto: 'PLANES DE AHORRO' };
    }
    // Hasta 100.000 km o No sabe -> continuar al bloque central de puntaje
    return { nextStepId: 'step_2a' };
  }

  // STEP 2A: ¿Cuándo le gustaría tener su próximo vehículo?
  if (currentStepId === 'step_2a') {
    return { nextStepId: 'step_3a' };
  }

  // STEP 3A: ¿Cómo imagina realizar la operación?
  if (currentStepId === 'step_3a') {
    return { nextStepId: 'step_4a' };
  }

  // STEP 4A: ¿Qué es más importante para usted?
  if (currentStepId === 'step_4a') {
    const quiereAmbas =
      opcionElegida.opcion_id === 'o_step4a_ambas' ||
      opcionElegida.texto.toLowerCase().includes('ambas alternativas');

    const { directa, planes } = calcularPuntosParciales(respuestasActualizadas);
    const dif = Math.abs(directa - planes);

    // Si pidió conocer ambas alternativas y la diferencia es pequeña (<= 2) -> AMBAS ALTERNATIVAS
    if (quiereAmbas && dif <= 2) {
      return { nextStepId: null, isImmediateFinish: true, canalFinalDirecto: 'AMBAS ALTERNATIVAS' };
    }

    // Si el resultado ya es claro (diferencia >= 2) -> Finalizar
    if (dif >= 2) {
      return { nextStepId: null };
    }

    // Si es parejo o empate (dif < 2) -> "Solo si hace falta - Desempate por experiencia previa"
    // Solo si el cliente tenía vehículo (contestó Sí en step_1)
    const respStep1 = respuestasActualizadas['step_1'];
    const teniaVehiculo =
      respStep1 &&
      (respStep1.opcion_id === 'o_step1_si' ||
        respStep1.texto.toLowerCase().trim() === 'sí' ||
        respStep1.texto.toLowerCase().trim() === 'si');

    if (teniaVehiculo) {
      return { nextStepId: 'step_desempate_1' };
    } else {
      // Si no tiene vehículo, no se pregunta modalidad anterior. Se deriva a AMBAS ALTERNATIVAS
      return { nextStepId: null, isImmediateFinish: true, canalFinalDirecto: 'AMBAS ALTERNATIVAS' };
    }
  }

  // DESEMPATE 1: ¿Cómo adquirió su vehículo actual?
  if (currentStepId === 'step_desempate_1') {
    const fueTradicionalOPlan =
      opcionElegida.opcion_id === 'o_des1_tradicional' ||
      opcionElegida.opcion_id === 'o_des1_plan' ||
      opcionElegida.texto.toLowerCase().includes('tradicional') ||
      opcionElegida.texto.toLowerCase().includes('plan');

    if (fueTradicionalOPlan) {
      return { nextStepId: 'step_desempate_2' }; // Preguntar si le gustaría repetir modalidad
    } else {
      // "Compró un usado" -> no hay preferencia previa de canal nuevo -> Finaliza
      return { nextStepId: null };
    }
  }

  // DESEMPATE 2: ¿Le gustaría repetir la misma modalidad?
  if (currentStepId === 'step_desempate_2') {
    return { nextStepId: null }; // Fin del flujo con desempate calculado
  }

  return { nextStepId: null };
}

/**
 * Returns user-friendly step number estimation for tablet progress bar
 */
export function getProgresoEstimado(stepId: FlowStepId): { paso: number; total: number } {
  switch (stepId) {
    case 'step_1':
      return { paso: 1, total: 4 };
    case 'step_2b':
      return { paso: 2, total: 5 };
    case 'step_3b':
      return { paso: 3, total: 5 };
    case 'step_2a':
      return { paso: 2, total: 4 };
    case 'step_3a':
      return { paso: 3, total: 4 };
    case 'step_4a':
      return { paso: 4, total: 4 };
    case 'step_desempate_1':
      return { paso: 5, total: 5 };
    case 'step_desempate_2':
      return { paso: 5, total: 5 };
    default:
      return { paso: 1, total: 4 };
  }
}
