
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
- Cada merchant tiene un chat contextual (efímero):
    - Para hacer preguntas
    - Para pedir resúmenes
    - Para aclarar dudas sobre su estado
- El chat se basa únicamente en el contexto del merchant
- **No se persiste el historial de chat** - es una herramienta de consulta temporal

---

## Resultado esperado

Con este sistema:

- El merchant nunca avanza sin contexto validado
- Los equipos trabajan con información consistente y trazable
- Se reduce retrabajo y fricción entre equipos
- Se mejora el time-to-go-live
- Se crea una base sólida para escalar operaciones

---

## Estado de Implementación

### ✅ Database Schema (Completado)

Se ha diseñado e implementado el schema completo de la base de datos PostgreSQL usando Drizzle ORM.

#### Decisiones de Diseño

##### 1. Lifecycle Stages

El sistema maneja **3 etapas** en el pipeline del merchant:

- `SCOPING` - Definición de requisitos y alcance
- `IMPLEMENTING` - Implementación técnica activa
- `LIVE` - Merchant operando en producción

**Decisión**: Se eliminó la etapa "Sales" del lifecycle original. El merchant entra al sistema cuando ya está en fase de scoping.

##### 2. Inbound Events (Arquitectura Polimórfica)

Tabla: `inboundEvent`

**Decisión**: Usar una única tabla con discriminador `source_type` en lugar de tablas separadas por fuente.

Tipos soportados:
- `MEETING` - Transcripciones de Gong, Zoom, etc.
- `EMAIL` - Correos de Gmail/Outlook
- `SLACK` - Mensajes y threads
- `SALESFORCE` - Notas y actualizaciones
- `DOCUMENT` - Documentos subidos manualmente
- `MANUAL` - Entradas manuales del equipo

**Ventajas**:
- Fácil extensión a nuevas fuentes sin cambios de schema
- Pipeline de procesamiento unificado
- Queries simplificadas para audit trail

La metadata específica de cada fuente se almacena en un campo JSONB:
```typescript
// MEETING: { title, participants, duration, recorded_at }
// EMAIL: { from, to, subject, received_at }
// SLACK: { channel, thread_ts, author }
```

##### 3. AI Extraction & Auto-Application

Tabla: `aiExtraction`

**Decisión**: AI aplica cambios automáticamente cuando tiene **alta confianza**, pero todos los cambios se registran en el audit log.

Workflow:
1. Inbound event procesado → AI extrae información
2. Si `confidence = "HIGH"` → Auto-aplicar cambio
3. Si `confidence = "MEDIUM" | "LOW"` → Requiere revisión humana
4. Todos los cambios AI → `auditLog` con `actor_type = "AI"` y referencia a `aiExtraction.id`

**Transparencia**: Cada extracción incluye un campo `reasoning` con la explicación generada por AI.

##### 4. Scope In Doc - Field-Level Completeness

Tabla: `scopeInDoc`

**Decisión**: Cada campo de datos tiene un campo `_status` asociado.

Estados posibles:
- `COMPLETE` - Información verificada y completa
- `PARTIAL` - Información incompleta o requiere validación
- `MISSING` - Sin información

Campos rastreados:
- PSPs
- Countries
- Payment Methods
- Expected Volume
- Expected Approval Rate
- Restrictions
- Dependencies
- Compliance Requirements
- Expected Go-Live Date

**Ventaja**: La UI puede mostrar exactamente qué falta para completar el scope y permitir promoción de etapa.

##### 5. Audit Log - Trazabilidad Total

Tabla: `auditLog`

**Decisión**: Registrar **cada cambio** en merchant data con contexto completo.

Cada entrada incluye:
- `target_table`, `target_id`, `target_field` - Qué cambió
- `old_value`, `new_value` - Valores (JSONB)
- `actor_type` - `AI | USER | SYSTEM`
- `actor_id` - ID del usuario (si aplica)
- `source_type`, `source_id` - De dónde vino el cambio
- `reason` - Por qué se hizo (generado por AI o provisto por usuario)
- `ai_extraction_id` - Link a la extracción AI (si aplica)

**Inmutabilidad**: No se soporta eliminación de merchants. Los datos son permanentes para auditoría.

##### 6. Promotion Gates

**Decisión**: No persistir intentos de promoción en base de datos.

Rationale:
- Las validaciones son reglas de negocio que pueden cambiar
- Los bloqueos se determinan en runtime basados en `scopeInDoc` completeness
- El historial de cambios de stage se captura en `auditLog` con `change_type = "STAGE_CHANGE"`

##### 7. Chat Contextual

**Decisión**: No persistir historial de chat.

Rationale:
- El chat es una herramienta de consulta temporal
- Toda la información importante debe capturarse en el merchant profile/scope
- Reduce complejidad y almacenamiento
- El contexto del chat se reconstruye desde el estado actual del merchant

##### 8. Attachments

Tabla: `attachment`

**Decisión**: Almacenar solo metadata, archivos en object storage (S3/R2).

Categorías:
- `CONTRACT` - Contratos y acuerdos
- `TECHNICAL_DOC` - Documentación técnica
- `OTHER` - Otros documentos relevantes

#### Schema Tables

| Tabla | Propósito | Registros Estimados |
|-------|-----------|---------------------|
| `merchantProfile` | Datos core del merchant + lifecycle | 1 por merchant |
| `scopeInDoc` | Requisitos de implementación | 1 por merchant |
| `inboundEvent` | Eventos de múltiples fuentes | 10-100 por merchant |
| `aiExtraction` | Cambios detectados por AI | 5-50 por merchant |
| `auditLog` | Historial completo de cambios | 50-500 por merchant |
| `attachment` | Archivos adjuntos | 2-10 por merchant |
| `paymentProcessors` | Catálogo de PSPs | ~100 registros |
| `countryProcessorFeatures` | Capacidades por país | ~1000 registros |

#### Índices Implementados

**Optimizaciones para queries comunes**:

- `merchantProfile`: `lifecycle_stage`, `contact_email`
- `scopeInDoc`: `merchant_id`, `is_complete`
- `inboundEvent`: `merchant_id`, `source_type`, `processing_status`, `created_at`
- `aiExtraction`: `merchant_id`, `inbound_event_id`, `status`, `confidence`
- `auditLog`: `merchant_id`, `target_table`, `actor_type`, `created_at`
- `attachment`: `merchant_id`, `category`

#### Relaciones

```
merchantProfile (1)
    ├── (1) scopeInDoc
    ├── (N) inboundEvent
    │       └── (N) aiExtraction
    ├── (N) auditLog
    └── (N) attachment

paymentProcessors
    └── (N) countryProcessorFeatures
```

### 🔄 Próximos Pasos

1. **Generar Drizzle migrations** - Crear archivos de migración SQL
2. **TRPC Routes** - Endpoints para CRUD de merchants
3. **AI Processing Pipeline** - Implementar lógica de extracción
4. **Promotion Gate Logic** - Reglas de validación para cambios de stage
5. **Dashboard UI** - Interfaz para visualizar y gestionar merchants

---
