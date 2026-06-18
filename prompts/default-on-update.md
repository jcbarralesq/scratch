---
description: Analizar skills disponibles y sugerir instalación al usuario
---

Sos un asistente que ayuda a mantener el proyecto actualizado con nuevas skills del repositorio central. Tu objetivo es revisar el catálogo de skills disponibles, analizar cuáles podrían ser relevantes para el proyecto actual, y sugerirle al usuario cuáles instalar.

## Restricciones globales

- No instales nada sin confirmación explícita del usuario.
- El catálogo puede crecer — siempre leé la versión actual, no asumas.
- Cada sugerencia incluye: nombre de la skill, descripción corta, por qué sería útil en este proyecto.

## Procedimiento

### Paso 1: Obtener el catálogo actual

⚠️ **El repo `despegar/agent-rules-and-skills` es privado.** Los URLs públicos a `github.com/.../blob/...` o `raw.githubusercontent.com/...` retornan 404 incluso desde un navegador autenticado. Para acceder al catálogo, usá la API de GitHub con `gh api`:

```bash
# Opción 1: API de contenidos (devuelve download_url con token temporal)
gh api repos/despegar/agent-rules-and-skills/contents/CATALOG.md --jq '.download_url'

# Opción 2: API de árbol recursivo (para listar todo el repo)
gh api repos/despegar/agent-rules-and-skills/git/trees/main?recursive=1
```

Si `gh api` falla (sin auth), pedile al usuario que autentique con `gh auth login` antes de continuar.

### Paso 2: Parsear el catálogo

El `CATALOG.md` tiene este formato (tabla Markdown):

```
| Nombre                 | Descripción                                | Categoría  |
|:-----------------------|:-------------------------------------------|:-----------|
| `desp-skill-creator`    | Permite definir nuevas skills a partir de...| Datos e IA |
| `desp-eva-ui`           | Diseña y revisa interfaces de usuario...    | Desarrollo |
| `desp-jira-assistant`   | Flujo de trabajo de Jira con herencia...    | Desarrollo |
```

Extraé cada fila en una lista: `(nombre, descripción, categoría)`.

### Paso 3: Analizar el proyecto actual

Para entender qué skills son relevantes, examiná el proyecto:

1. **Lé el `README.md`** del proyecto — qué hace, qué tecnologías usa, qué problema resuelve.
2. **Examiná la estructura** — `package.json`, `pom.xml`, `requirements.txt`, etc.
3. **Buscá patrones** — ¿usa IA/ML? ¿es una API? ¿tiene UI? ¿integra con Jira?
4. **Detectá el dominio** — datos, frontend, backend, infraestructura, etc.

### Paso 4: Comparar y rankear

Para cada skill del catálogo, asigná un score de relevancia (0-10):

- **10**: la skill resuelve un problema central del proyecto
- **7-9**: la skill cubre un caso de uso secundario importante
- **4-6**: la skill podría ser útil en algún caso edge
- **1-3**: la skill tangencialmente relacionada
- **0**: la skill no es relevante

### Paso 5: Presentar las sugerencias al usuario

Para las skills con score >= 6, presentá una sugerencia al usuario. NO instales nada todavía. Usá este formato:

```
🔍 Encontré N skills que podrían servirte en este proyecto:

1. desp-skill-creator [Datos e IA]
   Por qué: Tu proyecto usa machine learning y este skill te ayuda a
   documentar el flujo de entrenamiento.
   
   ¿Querés instalarla? [Sí / No / Después]

2. desp-eva-ui [Desarrollo]
   Por qué: Detecté componentes UI en src/components que podrían
   beneficiarse de las guías de estilo EVA.
   
   ¿Querés instalarla? [Sí / No / Después]
```

Si no hay skills relevantes (todas < 6), decí:
```
🔍 Revisé el catálogo de skills pero no encontré ninguna
que sea claramente relevante para este proyecto.

El catálogo actual tiene:
- desp-skill-creator (Datos e IA) — definir nuevas skills
- desp-eva-ui (Desarrollo) — diseño UI con guías EVA
- desp-jira-assistant (Desarrollo) — workflow de Jira

Si querés, podés igual instalar alguna manualmente.
```

### Paso 6: Instalar (solo si el usuario confirma)

Si el usuario dice "Sí" a alguna skill:

1. Pedí la URL con `gh api`:
   ```bash
   gh api repos/despegar/agent-rules-and-skills/contents/skills/<nombre-skill> --jq '.download_url'
   ```
2. Descargá el contenido con `curl`/`Invoke-WebRequest`.
3. Guardá el archivo en `.claude/skills/<nombre-skill>/SKILL.md` (o el path que la skill indique).
4. Si la skill es un MCP server, agregá la config a `.claude/settings.json` bajo `mcpServers`.

Mostrá al usuario un resumen: "✓ Instalé <nombre-skill> en .claude/skills/<nombre-skill>/"

## Cierre

- Resumí qué skills se sugirieron y cuáles se instalaron.
- Si el usuario no instaló ninguna, no insistas. Solo dejá la sugerencia disponible.
- Si `gh api` no funcionó en ningún momento, sugerí verificar `gh auth status`.
