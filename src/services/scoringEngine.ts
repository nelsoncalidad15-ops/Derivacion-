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

  let totalDirecta = 0;
  let totalPlanes = 0;
  const contribuciones: MotivoContribucion[] = [];

  // Preguntas base
  Object.entries(respuestas).forEach(([pregId, opcion]) => {
    if (!opcion) return;

    // STEP 3B: Hasta 130.000 km (+1 Directa)
    if (opcion.opcion_id === 'o_step3b_hasta100' || opcion.texto.toLowerCase().includes('hasta 130.000')) {
      totalDirecta += 1;
      contribuciones.push({
        preguntaTexto: 'Kilometraje del usado',
        opcionTexto: 'Hasta 130.000 km (unidad apta para toma en Venta Directa)',
        puntos: 1,
      });
      return;
    }

    // STEP 3B: Más de 130.000 km (+2 Planes)
    if (opcion.opcion_id === 'o_step3b_mas100' || opcion.texto.toLowerCase().includes('más de 130.000') || opcion.texto.toLowerCase().includes('mas de 130.000')) {
      totalPlanes += 2;
      contribuciones.push({
        preguntaTexto: 'Kilometraje del usado',
        opcionTexto: 'Más de 130.000 km (suma puntos hacia Plan de Ahorro)',
        puntos: -2,
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
      opcion.texto.toLowerCase().includes('comenzar con una cuota') || opcion.texto.toLowerCase().includes('pagar en cuotas y esperar')
    ) {
      totalPlanes += 2;
      contribuciones.push({
        preguntaTexto: 'Prioridad principal',
        opcionTexto: 'Pagar en cuotas y esperar para retirar el vehículo',
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

  // Si eligió conocer ambas alternativas, siempre ofrecer la elección final de por cuál comenzar
  if (quiereConocerAmbas) {
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
