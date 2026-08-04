# Guion de demo — 8 minutos

Tres casos elegidos para mostrar las tres cosas que definen la propuesta: que filtra, que profundiza y que escucha señales del mercado.

## Antes de empezar (checklist, 2 minutos antes de la llamada)

- [ ] Backend y frontend levantados; `pnpm prisma:seed` corrido.
- [ ] SMTP apuntando a un inbox de prueba (Mailtrap) y **la bandeja abierta en una pestaña**.
- [ ] Dashboard con datos: haber enviado 8–10 iniciativas de distintos canales en días previos, para que la tendencia de 30 días no salga plana.
- [ ] Sesión de evaluador iniciada en una pestaña; `/submit` abierto en otra, en ventana de incógnito para demostrar que no hay sesión.
- [ ] Textos de los tres casos copiados y listos para pegar.

---

## Caso 1 · El filtro (≈2:30)

**Qué demuestra:** que lo operativo no llega al comité.

1. En la ventana de incógnito, `/submit`. Señala que no hay login y que el formulario abre directo. Deja el canal en **Área interna de ACH**.
2. Pega una solicitud claramente operativa:

   > **Nombre:** Corregir el timeout en el reporte de conciliación diaria
   > **Necesidad:** El reporte de conciliación de las 6 a.m. falla dos de cada cinco días por timeout y el equipo lo relanza a mano.
   > **Por qué ahora:** Operaciones está reprocesando manualmente desde hace tres semanas.
   > **Para qué:** Que el reporte salga sin intervención humana.
   > **Cómo se resuelve hoy:** Alguien lo relanza a las 7 a.m.

3. Envía. En segundos aparece **Solicitud operativa → Producto / Operaciones & TI**.
4. **Cambia a la pestaña del inbox y muestra el correo que acaba de llegar**, con la clasificación, la justificación y el enlace al detalle.

> «Esto nunca llegó al Lab. El área dueña ya lo tiene, con contexto, sin que nadie leyera el formulario.»

---

## Caso 2 · La profundidad (≈3:30)

**Qué demuestra:** que lo que sí es del Lab recibe el expediente completo.

1. Mismo formulario; cambia el canal a **Organización externa**. Pega una propuesta disruptiva:

   > **Nombre:** Identidad reutilizable para transferencias de primer contacto
   > **Expectativa:** Una credencial verificable que el receptor pueda validar sin exponer datos del pagador.
   > **Necesidad:** Los bancos reportan fraude concentrado en transferencias inmediatas hacia destinatarios nuevos.
   > **Por qué ahora:** Bre-B multiplica el volumen de pagos entre desconocidos.
   > **Para qué:** Bajar el fraude de primer contacto sin agregar fricción al pago.
   > **Cómo se resuelve hoy:** Reglas estáticas por monto, revisadas manualmente.

2. Resultado: **Innovación disruptiva → Laboratorio Digital**. Lee la justificación en voz alta.
3. Cambia a la pestaña del evaluador. **Bandeja del Lab**: ahí está el caso, con la confianza del triage.
4. Pulsa **Evaluar ahora**. Mientras corre el pipeline, explica la separación: seis criterios puntuados por separado, y el Fit calculado por la lógica de negocio, no inventado por el modelo.
5. Muestra el resultado: score por criterio con justificación, Fit, prioridad y el business case de seis secciones.

> «El modelo escribió el argumento. El número que ordena el portafolio lo calculó el sistema con los pesos que un admin puede auditar.»

---

## Caso 3 · La señal externa (≈1:30)

**Qué demuestra:** el canal que el enunciado no pedía.

1. `/submit?source=international` — menciona que este enlace va en el QR que el equipo lleva a congresos.
2. Pega una referencia:

   > **Organización:** Pix (Banco Central de Brasil)
   > **Evento:** Sibos 2026
   > **Enlace:** el de la sesión
   > **Por qué es relevante:** Pix Automático habilita débitos recurrentes sobre el riel instantáneo; ACH no tiene equivalente sobre transferencias inmediatas.
   > **Nombre:** Débitos recurrentes sobre el riel de transferencias inmediatas

3. Resultado esperado: **Innovación adyacente → Laboratorio Digital**, con la referencia guardada como contexto del caso.

---

## Cierre (≈0:30)

Vuelve al **Dashboard**. Señala tres cosas y termina:

- El volumen del período contra el anterior.
- La distribución por clasificación: cuánto de lo que llega es realmente innovación.
- La tendencia de 30 días separando lo que se quedó del Lab de lo que se enrutó afuera.

> «Quince días de comité para la primera lectura, contra esto. Y el Lab solo mira lo que le corresponde.»

---

## Preguntas probables y respuesta corta

**¿Por qué la API de Anthropic y no Bedrock?** Es el mismo modelo. Bedrock lo sirve a través de AWS; nosotros lo consumimos directo para iterar más rápido dentro del plazo. El cambio es el cliente del SDK —`AnthropicBedrockMantle` en lugar de `Anthropic`— y el prefijo `anthropic.` en el id del modelo. Nada del código que lo usa cambia.

**¿Y si el modelo se equivoca en la clasificación?** La vista de auditoría lista todo lo enrutado fuera del Lab con su justificación y confianza, filtrable por canal y fecha. Es el instrumento para medir el 95% y para reclasificar a mano.

**¿Qué pasa si el LLM falla en el envío?** La iniciativa se guarda igual, en estado registrado, y un evaluador la clasifica manualmente. Nunca se pierde un envío.

**¿Cualquiera puede enviar spam?** El endpoint es anónimo por diseño, con límite de 10 envíos por hora y por origen, validación estricta de esquema antes de tocar el modelo, y sin cookies —no tiene superficie CSRF—. En AWS se le antepone WAF.

**¿Los pesos son fijos?** No. Son un catálogo editable; los activos deben sumar 100. Cada evaluación congela los que usó, así que cambiarlos no reescribe el pasado.
