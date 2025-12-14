
We are **Yuno**, a payments orchestration platform.
Yuno connects merchants to multiple PSPs (payment service providers), payment methods, and countries, and helps route, retry, and optimize payments across providers.


## Contexto

Yuno opera en un entorno de alta complejidad técnica y operativa, donde cada merchant tiene un conjunto único de requisitos: procesadores de pago, países, métodos de pago, restricciones regulatorias, acuerdos comerciales y fechas comprometidas.

Esta información se genera desde el primer contacto con el merchant y evoluciona a lo largo de su lifecycle (Sales → Scoping → Implementation → Live).

En la práctica, esta información **no nace de forma estructurada**. Se produce en:

- Llamadas de ventas e implementación
- Correos electrónicos
- Conversaciones en Slack
- Documentos y contratos
- Notas en Salesforce

Hoy, cada uno de estos canales captura solo una parte del contexto, y **no existe un mecanismo sistemático para consolidar, validar y gobernar esa información antes de avanzar de etapa**.

---

## Descripción del problema

El problema central es la **falta de control sobre el estado real y la completitud del contexto del merchant**.

La información crítica:

- Se encuentra distribuida entre múltiples herramientas
- Se pierde durante los handoffs entre equipos
- Se repite o se contradice
- No tiene trazabilidad clara sobre su origen
- No se valida formalmente antes de pasar a implementación

Como resultado:

- Merchants son promovidos a implementación sin un scope completo
- Se descubren requisitos técnicos tarde (PSPs no soportados, restricciones operativas, excepciones)
- Se genera retrabajo entre Sales, PM e Implementation
- La experiencia del merchant se deteriora por cambios tardíos de alcance

En un sistema de pagos, donde una decisión incorrecta puede bloquear un go-live completo, **avanzar sin visibilidad y validación del contexto introduce riesgo técnico y operativo**.

---

## Solución propuesta

Se propone construir un **Merchant Control & Readiness System**, cuyo objetivo es centralizar el perfil del merchant, estructurar automáticamente la información proveniente de canales no estructurados y **bloquear el avance de etapa hasta que el contexto esté completo y validado por un humano**.

El sistema no reemplaza a los equipos; **los asiste y les da control**.

---

## Componentes y requisitos del sistema

### 1. Merchant Dashboard (Source of Truth operativo)

- Dashboard central por merchant
- Contiene:
    - Merchant Profile (datos generales y estado actual)
    - Scope In Doc (información requerida para implementación)
    - Estado en el pipeline (lifecycle stage)
- Permite a los equipos:
    - Ver el estado real del merchant
    - Identificar información faltante
    - Revisar cambios sugeridos por AI
    - Validar o corregir datos antes de avanzar de etapa

---

### 2. Ingesta de datos (Inbound data)

El sistema recibe información automáticamente desde múltiples fuentes:

### a. Meetings (Sales / Implementation)

- Webhook recibe transcripciones de llamadas
- Se almacenan como eventos inmutables
- Se procesan mediante AI para extraer información relevante:
    - Requisitos técnicos
    - Restricciones operativas
    - Decisiones tomadas
    - Fechas comprometidas

### b. Emails (Gmail)

- Se analizan correos entrantes relacionados con el merchant
- Se extrae información relevante de forma automática
- El contenido original se conserva completo

📌 Ninguna fuente sobrescribe datos directamente sin dejar rastro.

---

### 3. AI-powered data extraction & suggestion

El sistema utiliza LLMs para:

- Extraer datos estructurados desde texto libre
- Detectar posibles actualizaciones al perfil o al scope
- Proponer cambios con un nivel de confianza

Ejemplo:

> “Detecté que el merchant viene de un Merchant of Record y requiere un PSP adicional en Brasil.”
> 

La AI:

- **Puede sugerir y actualizar datos**
- **Nunca elimina información existente**
- **Nunca cambia etapas del pipeline**

---

### 4. Event Log / Audit Trail (historial completo)

Cada acción queda registrada:

- Ingesta de meetings
- Procesamiento de emails
- Actualizaciones automáticas de campos
- Correcciones manuales
- Bloqueos o promociones de etapa

El log incluye:

- Qué cambió
- Valor anterior y nuevo
- Fuente (meeting, email, usuario, AI)
- Timestamp
- Actor (AI o humano)

Esto garantiza:

- Auditoría
- Trazabilidad
- Confianza en el sistema

---

### 5. Scope In Doc (Implementation Readiness)

El Scope In Doc representa **la información mínima requerida para implementar un merchant**:

- PSPs
- Países
- Métodos de pago
- Restricciones
- Métricas esperadas
- Dependencias especiales

Cada campo puede estar:

- Completo
- Parcial
- Faltante

El sistema evalúa continuamente el estado de completitud.

---

### 6. Lifecycle & Promotion Gates

El merchant avanza por etapas definidas del pipeline.

Cuando un usuario intenta promover un merchant a una nueva etapa:

1. El sistema ejecuta validaciones automáticas:
    - ¿El scope está completo?
    - ¿Existen requisitos no soportados?
    - ¿Hay contradicciones?
2. Si hay problemas:
    - Se bloquea la promoción
    - Se muestra qué información falta o qué debe corregirse
3. **Un miembro del equipo de Yuno revisa, corrige o añade la información necesaria**
4. Solo después de esta verificación humana, el merchant puede avanzar

---

### 7. Attachments & Contextual Chat

- Se pueden adjuntar contratos, documentos y archivos relevantes al perfil
- Cada merchant tiene un chat contextual:
    - Para hacer preguntas
    - Para pedir resúmenes
    - Para aclarar dudas sobre su estado
- El chat se basa únicamente en el contexto del merchant

---

## Resultado esperado

Con este sistema:

- El merchant nunca avanza sin contexto validado
- Los equipos trabajan con información consistente y trazable
- Se reduce retrabajo y fricción entre equipos
- Se mejora el time-to-go-live
- Se crea una base sólida para escalar operaciones

---