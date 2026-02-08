# Sistema de Manuales Operativos Multinegocio con IA por Voz

## 1. Visión General

El sistema es una plataforma centralizada que permite a un dueño con múltiples negocios
(documentados como restaurantes, locales de ropa u otros rubros)
crear, organizar y distribuir manuales operativos y de marca de forma estandarizada.

El objetivo principal es:
- Capturar el conocimiento operativo del negocio
- Estandarizar procesos
- Reducir errores humanos
- Facilitar la capacitación de empleados
- Permitir el crecimiento y la escalabilidad del negocio

El sistema está diseñado para funcionar con **múltiples negocios dentro de una sola cuenta**,
manteniendo separación lógica y control de accesos por rol.

---

## 2. Conceptos Clave del Sistema

- **Multinegocio:** un mismo dueño puede gestionar varios negocios independientes.
- **Estructura jerárquica:** negocio → categorías → manuales.
- **Creación por audio:** los manuales pueden crearse hablando, sin necesidad de escribir(ES LO MAS IMPORTANTE).
- **IA de transcripción y estructuración:** el audio se convierte automáticamente en procedimientos paso a paso(SUPER IMPORTANTE).
- **Roles con permisos diferenciados:** cada usuario ve y hace solo lo que corresponde.
- **Enfoque operativo real:** pensado para uso cotidiano en locales físicos.

---

## 3. Tipos de Usuarios y Roles

### 3.1 Administrador / Dueño

**Rol de mayor jerarquía.**

#### Permisos:
- Crear, editar y eliminar negocios
- Ver todos los negocios del sistema
- Ver, crear, editar y eliminar cualquier manual
- Definir categorías globales o por negocio
- Modificar configuraciones generales del sistema

#### Alcance:
- Visión completa y centralizada
- Control total del conocimiento operativo

---

### 3.2 Supervisor  

**Rol operativo intermedio.**

#### Permisos:
- Acceder únicamente al negocio asignado
- Crear manuales dentro de su negocio
- Grabar audios para generar procedimientos
- Editar manuales existentes
- Organizar categorías internas
- Activar o desactivar manuales

#### Restricciones:
- No puede ver otros negocios
- No puede crear ni eliminar negocios
- No puede administrar usuarios globales

---

### 3.3 Empleado

**Rol de ejecución.**

#### Permisos:
- Ver manuales del negocio al que pertenece
- Acceder solo a las categorías habilitadas
- Visualizar procedimientos paso a paso
- Escuchar el audio original del manual
- Marcar pasos como completados (opcional)

#### Restricciones:
- No puede crear manuales
- No puede editar contenido
- No puede ver métricas
- No puede acceder a otros negocios

---

## 4. Estructura Multinegocio

El sistema funciona bajo el concepto de **contenedores de negocio**.

Ejemplo:
- Restaurante Centro
- Restaurante Norte
- Restaurante Sur
- Local de Ropa

Cada negocio:
- Tiene sus propias categorías
- Tiene sus propios manuales
- Tiene usuarios asignados de forma independiente

Un usuario puede:
- Tener distintos roles en distintos negocios
- No existir en otros negocios

---

## 5. Categorías del Sistema(quiero que sean dinamicas, que las pueda crear el dueño o supervisor)

Las categorías son agrupadores lógicos de manuales.
Son **configurables por negocio**.

### Ejemplos para Restaurantes:
- Recetas
- Procedimientos de Cocina
- Apertura del Local
- Cierre del Local
- Higiene y Seguridad
- Atención al Cliente
- Manejo de Caja

### Ejemplos para Local de Ropa:
- Atención al Cliente
- Ventas y Upselling
- Apertura
- Cierre
- Visual Merchandising
- Control de Stock

---

## 6. Manuales Operativos

Un manual representa **un proceso concreto y ejecutable**.

Ejemplos:
- “Receta de Milanesa Napolitana”
- “Apertura Turno Mañana”
- “Cierre de Caja Diario”
- “Cómo atender una devolución”

Cada manual puede incluir:
- Título
- Descripción breve
- Procedimiento paso a paso
- Audio original
- Notas adicionales
- Estado (activo / inactivo)

---

## 7. Creación de Manuales por Audio (Funcionalidad Clave)

### Flujo de Creación:

1. El encargado accede a su negocio
2. Selecciona una categoría
3. Presiona “Crear Manual”
4. Graba un audio explicando el procedimiento
5. La IA procesa el audio

### Procesamiento por IA:
- Transcripción del audio a texto
- Limpieza de muletillas
- Detección de pasos secuenciales
- Organización automática del contenido
- Generación de estructura tipo checklist

### Ejemplo de Resultado:

**Receta – Milanesa Napolitana**
1. Sacar la milanesa del freezer.
2. Freír durante 7 minutos.
3. Agregar cheddar.
4. Agregar panceta.
5. Espolvorear orégano.

---

## 8. Edición y Revisión de Manuales

- El encargado puede editar:
  - texto
  - orden de pasos
  - agregar notas
- La edición es opcional
- El objetivo es minimizar la fricción

---

## 9. Consumo de Manuales por Empleados

### Experiencia de Usuario (UX):

- Interfaz simple
- Navegación por:
  - negocio
  - categoría
  - manual
- Visualización clara de pasos
- Opción de escuchar el audio original
- Posibilidad de marcar pasos como realizados

Pensado para:
- Personas con poca experiencia técnica
- Uso rápido en situaciones reales de trabajo

---

## 10. Control de Accesos y Seguridad

El sistema implementa control por:
- Usuario
- Rol
- Negocio

Ejemplo:
- Un encargado no puede acceder a otro negocio ni siquiera por URL directa
- Un empleado no ve botones de edición

Esto garantiza:
- Seguridad
- Claridad
- Orden operativo

---

## 11. Descarga de Manuales a PDF

**Funcionalidad importante para distribuir manuales.**

El sistema permite descargar los manuales de marca en formato PDF, lo cual es esencial para:
- Imprimir manuales operativos para uso en locales físicos
- Distribuir documentación sin necesidad de acceso digital
- Crear archivos documentales de consulta rápida
- Facilitar capacitación presencial con material impreso
- Garantizar disponibilidad de procedimientos sin dependencia de conexión a internet

#### Permisos de descarga:
- **Administrador:** descarga cualquier manual de cualquier negocio
- **Supervisor:** descarga manuales de su negocio
- **Empleado:** puede descargar manuales asignados (según configuración)

---

## 12. Escalabilidad y Evolución

El sistema está preparado para crecer hacia:
- Nuevos negocios
- Franquicias
- Auditorías internas
- Checklists obligatorios
- Versionado de procedimientos
- IA que sugiera mejoras operativas

---

## 13. Propuesta de Valor

Este sistema transforma:
- Conocimiento oral → conocimiento estructurado
- Dependencia de personas → procesos estandarizados
- Capacitación informal → manuales claros y accesibles

---

## 14. Mensaje Clave para el Dueño

> “Todo lo que hoy está en tu cabeza o en la del chef,
queda guardado, ordenado y disponible para cualquier empleado,
en cualquier momento, sin que tengas que explicarlo mil veces.”

---

## 15. Conclusión

Este sistema no es solo una herramienta técnica.
Es una **base de orden, control y crecimiento** para negocios físicos reales,
diseñada desde la operación diaria hacia la escalabilidad futura.
