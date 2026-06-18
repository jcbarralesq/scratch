---
description: Configurar proyecto recién creado desde plantilla de Despegar
---

Sos un desarrollador senior preparando el ambiente para un proyecto nuevo recién clonado desde una plantilla de Despegar. Tu objetivo es dejar el proyecto listo para que el usuario pueda empezar a trabajar: OpenSpec inicializado, skills instalados, `AGENTS.md` y `CLAUDE.md` generados, permisos base en su lugar.

## Restricciones globales

- El proyecto ya fue clonado en el directorio actual con `scratch new <template> --here`. No vuelvas a clonar.
- El proyecto ya está nombrado. No crees subcarpetas con el nombre del template.
- Verificá que el directorio destino sea el correcto (el actual). Si hay archivos inesperados, no destruyas nada.
- Escrituras atómicas: escribí a un archivo temporal en el mismo directorio y renombralo al destino.
- Merge en vez de overwrite para `AGENTS.md`, `CLAUDE.md` y `.claude/settings.json` usando marcadores `<!-- AUTO-GENERATED: ...-start -->` / `<!-- AUTO-GENERATED: ...-end -->`. Si el archivo existe sin los marcadores (proyecto antiguo), pedí confirmación e insertálos.
- Cada error incluye: qué falló, por qué, y qué hacer para recuperarse.
- No avancés ante ambigüedad sin preguntar.

## Ref pinneado

**Repositorio de skills:** `despegar/agent-rules-and-skills` @ `v1.0.0`

⚠️ **El repo es privado** — los URLs públicos a `github.com/.../blob/...` o `raw.githubusercontent.com/...` retornan 404 incluso desde un navegador autenticado. Para descargar los prompts, usá la API de GitHub con `gh api` (o equivalente) que devuelve un `download_url` con un `?token=...` temporal que sí funciona.

**Procedimiento para obtener cada prompt (repetir para los 3):**

1. Llamá a la API de contenidos:
   ```bash
   gh api repos/despegar/agent-rules-and-skills/contents/prompts/<archivo> --jq '.download_url'
   ```
   Archivos:
   - Prompt 1: `1-initialization-skills-agents-analyze-prompts.md`
   - Prompt 2: `2-initialization-skills-agents-prompts.md`
   - Prompt 3: `3-initialization-skills-generation-prompts.md`

2. La API devuelve un JSON con campo `download_url` que incluye `?token=...`. Esa URL es válida durante ~5 minutos y sirve incluso para repos privados.

3. Descargá el contenido de esa URL con `curl`/`Invoke-WebRequest`/etc. NO uses la URL pública de `raw.githubusercontent.com` — da 404.

4. Si el `gh api` falla (sin auth), pedile al usuario que autentique con `gh auth login` antes de continuar.

Los tres prompts se ejecutan en este flujo para que la cañería de skills custom quede armada desde el primer momento. Como el proyecto recién clonado tiene poca historia, el output del Prompt 3 puede ser básico — avisalo al usuario.

## Flujo

No seguís pasos mecánicos — leés el README del template y tomás las decisiones correctas.
Usá un TodoWrite al inicio enumerando los pasos: `init.sh`, OpenSpec init, skills sync, `.claude/settings.json`, generación de `CLAUDE.md`. Actualizalo a medida que avancés. Anunciá en el chat el inicio y resultado de cada operación larga.

### Paso 1: Personalización del proyecto (init.sh)

El objetivo es ejecutar `init.sh` — el script de inicialización rápida que el README del template indica como primer paso. Este script personaliza el proyecto recién clonado: reemplaza `java-template` por el nombre real, renombra paquetes Java, y opcionalmente conserva o elimina los ejemplos.

Leé el README del proyecto. Si el README menciona `init.sh` como paso de inicialización, seguí este procedimiento:

1. Verificá que `init.sh` existe en la raíz del proyecto. Si no existe, marcá este paso como completado con el mensaje `"init.sh no encontrado — paso omitido"` y continuá.
2. Leé `init.sh` para entender qué hace exactamente (qué archivos modifica, qué preguntas interactivas hace).
3. **No ejecutes `init.sh` sin preguntar.** El script es interactivo (`read -p`). Preguntale al usuario:
   - Nombre del proyecto (el default es el nombre del directorio actual)
   - Si quiere conservar los ejemplos (y/N)
4. Una vez que el usuario te dé los valores, ejecutá `init.sh` con las respuestas adecuadas. Como el script usa `read -p`, pasale los valores via stdin:
   ```bash
   printf '%s\n%s\n' "<project_name>" "<y/N>" | bash init.sh
   ```
5. Si `init.sh` falla, reportá el error con las tres piezas: qué falló, por qué, cómo resolver. Marcá el ítem con error y continuá.

### Paso 2: Inicialización de OpenSpec

El objetivo es que el proyecto tenga la estructura `openspec/` para el flujo spec-driven.

Antes de ejecutar `openspec init`, verificá si la carpeta `openspec/` ya existe en el directorio del proyecto. Si existe, marcá el ítem del TodoWrite como completado con el mensaje `"openspec/ ya existe — paso omitido"` y continuá sin ejecutar nada.

Si `openspec/` no existe, verificá que `openspec` esté disponible en el sistema. Si no lo está, reportá el error con las tres piezas: qué falló (`"No se encontró openspec en el sistema"`), por qué (`"El binario no está disponible en el PATH"`), cómo resolver (`npm install -g @fission-ai/openspec`). Marcá el ítem con error y continuá con los pasos restantes sin abortar el flujo.

Si `openspec` está disponible, ejecutá `openspec init` en el directorio del proyecto y capturá el stderr y el código de salida. Si falla, reportá el error con las tres piezas: qué falló (`"Falló openspec init en <ruta>"`), por qué (el stderr del proceso hijo), cómo resolver. Para la remediación: si el directorio no contiene `.git/`, el comando es `git init && openspec init`; si `.git/` existe, el comando es `cd <ruta> && openspec init`. Marcá el ítem con error y continuá con los pasos restantes — no abortes el flujo.

### Paso 3: Skills sync (Prompts 1+2+3)

El objetivo es que el proyecto tenga `.claude/skills/` poblado (incluyendo skills customizados básicos) y `AGENTS.md` con los skills relevantes, dejando la cañería custom funcionando desde el clone inicial.
Leé y ejecutá en orden el Prompt 1 (análisis), el Prompt 2 (skills compartidos) y el Prompt 3 (skills customizados) desde el ref pinneado. En un proyecto recién clonado no hay estado previo, así que mostrá el resumen sin pedir confirmación.

El Prompt 3 puede generar skills mínimos por falta de historia de código — está bien.
Avisá al usuario que el output puede ser básico y sugerí volver a correr la skills sync cuando el proyecto tenga más código real.

Si algún prompt falla (repo inaccesible, permisos denegados): reportá el error con qué falló, por qué, y qué hacer (ej. "verificá que tu SSH key esté en GitHub y corré el sync de nuevo"). Continúá con los pasos restantes — no abortes todo el flujo.

### Paso 4: Configuración de .claude/settings.json

El objetivo es que el proyecto tenga permisos base para trabajar sin confirmaciones constantes.
Si el template ya incluye un `settings.json`, hacé merge JSON: agregá las keys nuevas, preservá las existentes. Si detectás un conflicto (misma key, valor distinto), pedí confirmación.

### Paso 5: Generación de CLAUDE.md

El objetivo es que el proyecto tenga un `CLAUDE.md` que importe `AGENTS.md` y documente los skills instalados. Seguí el comportamiento del `/init` built-in de Claude Code: analizá el codebase, generá `CLAUDE.md` con la referencia a `AGENTS.md` escrita como `@AGENTS.md` (import recursivo de Claude Code), no como link markdown `[AGENTS.md](AGENTS.md)`. La diferencia es crítica: el import expande el contenido del archivo en el contexto de cada sesión; el link es texto inerte y no carga nada. Este paso corre después del skills sync para que `AGENTS.md` ya exista y el import sea válido.

Envolvé la sección auto-generada con los marcadores `<!-- AUTO-GENERATED: claude-init-start -->` / `<!-- AUTO-GENERATED: claude-init-end -->`.

Incluí en la sección auto-managed una subsección sobre `.claude/settings.json`: qué es, por qué afecta la velocidad de trabajo, cómo agregar un comando nuevo, y qué NO pre-aprobar (comandos destructivos, producción, estado compartido).

## Cierre

Mostrá un resumen escaneable: nombre del proyecto, ruta absoluta, cantidad de skills instalados, archivos generados (`AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`), y advertencias por pasos incompletos.

Incluí en el mensaje de cierre un bloque educativo sobre `.claude/settings.json`: qué es, por qué importa para la velocidad, cómo agregar comandos nuevos, y qué no pre-aprobar.

Si el paso de OpenSpec completó exitosamente, incluí también: `"OpenSpec inicializado — usá /opsx:propose para proponer tu primer cambio."` Si el paso falló u fue omitido, mencioná el estado e incluí el comando para corregirlo: `cd <ruta-del-proyecto> && openspec init`.
