import { CanalDerivacion, Configuracion, MotivoContribucion, Opcion, Pregunta, ResultadoDerivacion } from '../types';

export function evaluarDerivacion(
  respuestas: Record<string, Opcion>,
  preguntas: Pregunta[],
  config: Configuracion,
  canalFastTrack?: CanalDerivacion
): ResultadoDerivacion {
  // 1. Fast Track (Step 0)
  if (canalFastTrack && (canalFastTrack === 'VENTA DIRECTA' || canalFastTrack === 'PLANES DE AHORRO')) {
    return {
      canal: canalFastTrack,
      puntosDirecta: canalFastTrack === 'VENTA DIRECTA' ? 4 : 0,
      puntosPlanes: canalFastTrack === 'PLANES DE AHORRO' ? 4 : 0,
      diferencia: 4,
      umbral: 2,
      motivosPrincipales: [
        {
          preguntaTexto: 'Modalidad seleccionada',
          opcionTexto: `Elección directa del cliente (${canalFastTrack})`,
          puntos: 4,
        },
      ],
      esAccesoRapido: true,
    };
  }

  // 2. Regla fuerte: Si quiere entregar su vehículo y supera los 100.000 km -> PLANES DE AHORRO
  const resp3b = respuestas['step_3b'] || respuestas['p4'] || Object.values(respuestas).find((r) =>
    r.opcion_id === 'o_step3b_mas100' ||
    r.texto.toLowerCase().includes('más de 100.000') ||
    r.texto.toLowerCase().includes('mas de 100.000')
  );

  if (resp3b && (resp3b.opcion_id === 'o_step3b_mas100' || resp3b.texto.includes('100.000'))) {
    return {
      canal: 'PLANES DE AHORRO',
      puntosDirecta: 0,
      puntosPlanes: 10,
      diferencia: 10,
      umbral: 2,
      motivosPrincipales: [
        {
          preguntaTexto: 'Regla comercial de toma de usados',
          opcionTexto: 'Vehículo con más de 100.000 km (orienta a Plan de Ahorro para renovación)',
          puntos: 10,
        },
      ],
      esAccesoRapido: false,
    };
  }

  let totalDirecta = 0;
  let totalPlanes = 0;
  const contribuciones: MotivoContribucion[] = [];

  // Preguntas base
  Object.entries(respuestas).forEach(([pregId, opcion]) => {
    if (!opcion) return;

    // STEP 3B: Hasta 100.000 km (+1 Directa)
    if (opcion.opcion_id === 'o_step3b_hasta100' || opcion.texto.toLowerCase().includes('hasta 100.000')) {
      totalDirecta += 1;
      contribuciones.push({
        preguntaTexto: 'Kilometraje del usado',
        opcionTexto: 'Hasta 100.000 km (unidad apta para toma en Venta Directa)',
        puntos: 1,
      });
      return;
    }

    // STEP 2A: ¿Cuándo le gustaría tener su próximo vehículo?
    if (opcion.opcion_id === 'o_step2a_inmediato' || opcion.texto.toLowerCase().includes('lo antes posible') || opcion.texto.toLowerCase().includes('este mes')) {
      totalDirecta += 2;
      contribuciones.push({
        preguntaTexto: 'Plazo deseado',
        opcionTexto: 'Este mes / lo antes posible',
        puntos: 2,
      });
      return;
    }
    if (opcion.opcion_id === 'o_step2a_meses' || opcion.texto.toLowerCase().includes('algunos meses') || opcion.texto.toLowerCase().includes('puedo esperar')) {
      totalPlanes += 2;
      contribuciones.push({
        preguntaTexto: 'Plazo deseado',
        opcionTexto: 'Puedo esperar algunos meses',
        puntos: 2,
      });
      return;
    }

    // STEP 3A: ¿Cómo imagina realizar la operación?
    if (
      opcion.opcion_id === 'o_step3a_dinero' ||
      opcion.opcion_id === 'o_step3a_saldo' ||
      opcion.texto.toLowerCase().includes('dinero para una entrega') ||
      opcion.texto.toLowerCase().includes('financiar el saldo')
    ) {
      totalDirecta += 2;
      contribuciones.push({
        preguntaTexto: 'Forma de pago',
        opcionTexto: opcion.texto,
        puntos: 2,
      });
      return;
    }
    if (
      opcion.opcion_id === 'o_step3a_cuotas' ||
      opcion.texto.toLowerCase().includes('pagando cuotas')
    ) {
      totalPlanes += 2;
      contribuciones.push({
        preguntaTexto: 'Forma de pago',
        opcionTexto: opcion.texto,
        puntos: 2,
      });
      return;
    }

    // STEP 4A: ¿Qué es más importante para usted?
    if (
      opcion.opcion_id === 'o_step4a_rapido' ||
      opcion.texto.toLowerCase().includes('retirar el vehículo lo antes posible')
    ) {
      totalDirecta += 2;
      contribuciones.push({
        preguntaTexto: 'Prioridad principal',
        opcionTexto: 'Retirar el vehículo lo antes posible',
        puntos: 2,
      });
      return;
    }
    if (
      opcion.opcion_id === 'o_step4a_cuota' ||
      opcion.texto.toLowerCase().includes('comenzar con una cuota')
    ) {
      totalPlanes += 2;
      contribuciones.push({
        preguntaTexto: 'Prioridad principal',
        opcionTexto: 'Poder comenzar con una cuota y puedo esperar',
        puntos: 2,
      });
      return;
    }
  });

  // STEP 4A Selección de "Quiero conocer ambas alternativas"
  const resp4a = respuestas['step_4a'];
  const quiereConocerAmbas =
    resp4a &&
    (resp4a.opcion_id === 'o_step4a_ambas' ||
      resp4a.texto.toLowerCase().includes('ambas alternativas'));

  // Desempate por experiencia previa
  const respDesempate1 = respuestas['step_desempate_1'];
  const respDesempate2 = respuestas['step_desempate_2'];

  if (respDesempate1 && respDesempate2) {
    const eraTradicional =
      respDesempate1.opcion_id === 'o_des1_tradicional' ||
      respDesempate1.texto.toLowerCase().includes('tradicional');
    const eraPlan =
      respDesempate1.opcion_id === 'o_des1_plan' ||
      respDesempate1.texto.toLowerCase().includes('plan');

    const deseaRepetir =
      respDesempate2.opcion_id === 'o_des2_si' ||
      respDesempate2.texto.toLowerCase().trim() === 'sí' ||
      respDesempate2.texto.toLowerCase().trim() === 'si';

    if (deseaRepetir) {
      if (eraTradicional) {
        totalDirecta += 1;
        contribuciones.push({
          preguntaTexto: 'Experiencia previa',
          opcionTexto: 'Compró por venta tradicional y prefiere repetir modalidad (+1)',
          puntos: 1,
        });
      } else if (eraPlan) {
        totalPlanes += 1;
        contribuciones.push({
          preguntaTexto: 'Experiencia previa',
          opcionTexto: 'Compró por plan de ahorro y prefiere repetir modalidad (+1)',
          puntos: 1,
        });
      }
    } else {
      if (eraTradicional) {
        totalPlanes += 1;
        contribuciones.push({
          preguntaTexto: 'Experiencia previa',
          opcionTexto: 'Compró tradicional y desea probar Plan de Ahorro (+1)',
          puntos: 1,
        });
      } else if (eraPlan) {
        totalDirecta += 1;
        contribuciones.push({
          preguntaTexto: 'Experiencia previa',
          opcionTexto: 'Compró por plan de ahorro y prefiere Venta Tradicional (+1)',
          puntos: 1,
        });
      }
    }
  }

  const dif = Math.abs(totalDirecta - totalPlanes);

  // Si eligió conocer ambas alternativas y el puntaje está equilibrado
  if (quiereConocerAmbas && dif <= 2) {
    return {
      canal: 'AMBAS ALTERNATIVAS',
      puntosDirecta: totalDirecta,
      puntosPlanes: totalPlanes,
      diferencia: dif,
      umbral: 2,
      motivosPrincipales: [
        {
          preguntaTexto: 'Preferencia del cliente',
          opcionTexto: 'Solicitó conocer y comparar ambas alternativas comerciales',
          puntos: 2,
        },
        ...contribuciones.slice(0, 2),
      ],
      esAccesoRapido: false,
    };
  }

  // Si la diferencia es clara (>= 2 o definida por desempate)
  if (totalDirecta > totalPlanes && (dif >= 2 || (respDesempate1 && dif >= 1))) {
    return {
      canal: 'VENTA DIRECTA',
      puntosDirecta: totalDirecta,
      puntosPlanes: totalPlanes,
      diferencia: dif,
      umbral: 2,
      motivosPrincipales: contribuciones.filter((c) =>
        c.preguntaTexto !== 'Plazo deseado' || totalDirecta > totalPlanes
      ).slice(0, 3),
      esAccesoRapido: false,
    };
  }

  if (totalPlanes > totalDirecta && (dif >= 2 || (respDesempate1 && dif >= 1))) {
    return {
      canal: 'PLANES DE AHORRO',
      puntosDirecta: totalDirecta,
      puntosPlanes: totalPlanes,
      diferencia: dif,
      umbral: 2,
      motivosPrincipales: contribuciones.slice(0, 3),
      esAccesoRapido: false,
    };
  }

  // Respuestas equilibradas / empate
  return {
    canal: 'AMBAS ALTERNATIVAS',
    puntosDirecta: totalDirecta,
    puntosPlanes: totalPlanes,
    diferencia: dif,
    umbral: 2,
    motivosPrincipales: [
      {
        preguntaTexto: 'Evaluación comercial',
        opcionTexto: 'Respuestas equilibradas entre inmediatez y financiación en cuotas',
        puntos: 0,
      },
      ...contribuciones.slice(0, 2),
    ],
    esAccesoRapido: false,
  };
}
