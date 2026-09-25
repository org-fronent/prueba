# Rúbrica de Evaluación - Sprint 1

**Proyecto:** LastBite  
**Programa:** Análisis y Desarrollo de Software  
**Sprint:** 1 - Fundamentos, Estructura y Autenticación  

---

## 📊 Matriz de Criterios de Evaluación

| Criterio | Excelente (5.0) | Satisfecho / Aceptable (4.0) | Necesita Mejora (3.0) | Insuficiente (1.0 - 2.0) | Peso |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Estructura y Gobernanza en GitHub** | Estructura de carpetas completa. Configuración impecable de `.github/`, `CODEOWNERS` e `.gitignore`. | Estructura funcional con carpetas básicas. Faltan ajustes menores en reglas de gobernanza. | Estructura desorganizada o falta de archivos clave como `CODEOWNERS` o `.gitignore`. | No presenta la estructura requerida o existen archivos sensibles expuestos. | **20%** |
| **Historias de Usuario y Documentación** | Historias de usuario detalladas en `.github/ISSUE_TEMPLATE/` con formato BDD, criterios de aceptación y notas técnicas. | Historias de usuario claras, pero con pocos detalles técnicos o sin escenarios de prueba BDD. | Documentación incompleta, vaga o sin seguir las plantillas definidas en `/docs`. | Ausencia de historias de usuario y de documentación del proyecto. | **20%** |
| **Gestión de Git y Flujo de Trabajo** | Historial de commits con mensajes convencionales (`feat`, `docs`, `fix`), uso correcto de ramas y Pull Requests revisados. | Commits entendibles y uso de ramas, pero con mensajes poco estandarizados. | Todo el trabajo se subió en una sola rama o con un único commit masivo. | Mal uso de comandos Git, conflictos no resueltos o código subido directamente a `main`. | **20%** |
| **Calidad del Código y Arquitectura** | Código limpio (Clean Code), modularizado en `/src`, aplicando buenas prácticas de desarrollo e identación impecable. | Código funcional en `/src`, aunque con ligera duplicación de lógica o falta de modularidad. | Código poco claro, sin modularización o mezclando responsabilidades en un solo archivo. | El código presenta errores sintácticos, no ejecuta o no está ubicado en `/src`. | **25%** |
| **Seguridad y Prácticas Backend** | Encriptación de contraseñas con `bcrypt`, variables de entorno protegidas y manejo seguro de tokens JWT. | Manejo de autenticación funcional, pero con omisión de validaciones secundarias de entrada. | Contraseñas almacenadas en texto plano o claves expuestas en el código fuente. | No existe implementación de seguridad o mecanismos de autenticación. | **15%** |

---

## 📈 Escala de Calificación Final

* **Sobresaliente (4.6 - 5.0):** El proyecto cumple con todos los requerimientos técnicos, arquitectónicos y de documentación con estándares profesionales.
* **Aprobado (3.5 - 4.5):** El proyecto cumple con la funcionalidad requerida, aunque presenta oportunidades de mejora en documentación o buenas prácticas.
* **No Aprobado (< 3.5):** El proyecto presenta fallas críticas de ejecución, falta de estructura o incumplimiento de los criterios mínimos de seguridad y gobernanza.