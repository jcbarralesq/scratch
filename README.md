# 🌱 From Scratch CLI

> _Build your next project from scratch._

A template-driven project generator. Create new projects from GitHub templates and automatically install slash commands for **Claude Code**, **Cursor**, and **VS Code**.

[![GitHub stars](https://img.shields.io/github/stars/jcbarralesq/scratch?style=social)](https://github.com/jcbarralesq/scratch)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A516-green)](https://nodejs.org)

## Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
  - [Option 1: npx (no install)](#option-1-npx-no-install)
  - [Option 2: npm install -g](#option-2-npm-install--g)
  - [Option 3: Local install (recommended for development)](#option-3-local-install-recommended-for-development)
- [Commands](#-commands)
- [Working with Templates](#-working-with-templates)
- [Editor Integration](#-editor-integration)
  - [Claude Code](#claude-code)
  - [Cursor](#cursor)
  - [VS Code](#vs-code)
- [Usage Examples](#-usage-examples)
- [Cross-Platform](#-cross-platform)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## Why From Scratch?

- 🚀 **Zero-install usage** — `npx` and go
- 🔌 **Multi-editor** — Claude Code, Cursor, VS Code
- 📦 **GitHub or local templates** — flexible sources
- 🌍 **Cross-platform** — Windows, macOS, Linux, WSL
- 🪶 **Lightweight** — pure Node.js, no Python or other runtimes

## Quick Start

```bash
# Run without installing anything
npx -y github:jcbarralesq/scratch new mcp-template mi-proyecto

# Or install globally
npm install -g github:jcbarralesq/scratch
scratch new mcp-template mi-proyecto
```

## Installation

### Prerequisites

- **Node.js 16+** (LTS recommended) — [download](https://nodejs.org)
- **Git** — [download](https://git-scm.com/downloads)
- **npm** (comes with Node.js)

### Option 1: npx (no install)

Run `scratch` directly from GitHub without installing. The CLI will be downloaded on first use and cached for subsequent calls.

```bash
npx -y github:jcbarralesq/scratch list
npx -y github:jcbarralesq/scratch new mcp-template mi-proyecto
npx -y github:jcbarralesq/scratch init all
```

### Option 2: npm install -g

Install globally so `scratch` is always available in your terminal.

```bash
npm install -g github:jcbarralesq/scratch

# Now you can use scratch from anywhere
scratch list
scratch new mcp-template mi-proyecto
```

To upgrade later:
```bash
npm update -g github:jcbarralesq/scratch
```

To uninstall:
```bash
npm uninstall -g from-scratch
```

### Option 3: Local install (recommended for development)

If you want to modify `scratch` itself:

```bash
git clone https://github.com/jcbarralesq/scratch.git
cd scratch
npm install
npm link  # makes 'scratch' available globally, linked to this checkout
```

## Commands

| Command | Description |
|---------|-------------|
| `scratch list` | List available templates in the registry |
| `scratch new <template> <name>` | Create a new project from a template |
| `scratch update [name]` | Update templates from remote sources |
| `scratch info <template>` | Show details about a template |
| `scratch templates` | Show resolved paths for all templates |
| `scratch config <action>` | View and modify settings |
| `scratch doctor` | Check registry health |
| `scratch init [editor]` | Install slash commands for an editor |

Run `scratch --help` for the full reference.

## Working with Templates

### Listing templates

```bash
scratch list                # all
scratch list --local        # local only
scratch list --remote       # GitHub only
scratch list --json         # JSON output for scripts
```

### Creating a project

```bash
# Interactive (asks for template, name, path, editor)
scratch new

# Explicit
scratch new mcp-template mi-proyecto

# With options
scratch new react-app my-app --path ./workspace --force
scratch new api-service my-api --no-install
```

The `new` command will:

1. Download the template (if remote)
2. Create the project directory
3. Replace template variables (`{{project_name}}`, etc.)
4. **Ask which editor to integrate** (Claude/Cursor/VSCode/all)
5. Install slash commands in the project
6. Run `npm install` (if `package.json` exists)

### Template variables

Inside your template files, use `{{variable}}` placeholders. They will be replaced when the project is created.

| Variable | Example | Description |
|----------|---------|-------------|
| `{{project_name}}` | `my-project` | Kebab-case project name |
| `{{project_name_camel}}` | `myProject` | camelCase version |
| `{{project_name_pascal}}` | `MyProject` | PascalCase version |

## Editor Integration

`scratch init [editor]` installs slash commands (or VS Code tasks) in your project. Editor is one of:

- `claude` — Claude Code
- `cursor` — Cursor
- `vscode` — Visual Studio Code
- `all` — all of the above (default)

```bash
# In your project directory
scratch init              # all editors
scratch init all          # same
scratch init claude       # only Claude Code
scratch init cursor       # only Cursor
scratch init vscode       # only VS Code

# Global install (for all projects)
scratch init all --global

# Preview without making changes
scratch init all --dry-run

# Remove
scratch init all --uninstall
```

### Claude Code

Installs slash commands in `.claude/commands/`:

```
.claude/commands/
├── scratch-new.md
├── scratch-list.md
├── scratch-add.md
├── scratch-remove.md
├── scratch-update.md
├── scratch-info.md
├── scratch-templates.md
├── scratch-config.md
└── scratch-doctor.md
```

After installation, in Claude Code:

```
/scratch:list
/scratch:new mcp-template mi-proyecto
/scratch:doctor
```

### Cursor

Same structure as Claude Code, but installed in `.cursor/commands/`.

```
.cursor/commands/
├── scratch-new.md
├── scratch-list.md
├── ...
```

In Cursor:

```
/scratch:list
/scratch:new mcp-template mi-proyecto
```

### VS Code

Updates `.vscode/tasks.json` with shell tasks:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Scratch: Create a new project from a template",
      "type": "shell",
      "command": "node",
      "args": ["path/to/scratch.js", "new"],
      ...
    },
    ...
  ]
}
```

In VS Code:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
2. Type "Tasks: Run Task"
3. Select one of the "Scratch: ..." tasks

## Usage Examples

### Example 1: Start a new MCP server

```bash
scratch new mcp-template mi-primer-mcp
cd mi-primer-mcp
# Open in your editor
code .
# Or: cursor .
# Or: claude
```

### Example 2: Add a template from your team

```bash
scratch add team-frontend --git yourorg/frontend-template
scratch new team-frontend my-frontend
```

### Example 3: Add templates from the despegar org

```bash
# 25+ templates from github.com/despegar
scratch add java-template --git despegar/java-template
scratch add kotlin-template --git despegar/kotlin-template
scratch add nestjs-template --git despegar/nestjs-template
scratch new java-template mi-servicio
```

### Example 4: Use from CI / scripts

```bash
# Non-interactive workflow
scratch new mcp-template my-app --no-install --no-commands
```

### Example 5: Update a template

```bash
# Update a specific template
scratch update mcp-template

# Update all remote templates
scratch update --all

# Force re-download
scratch update mcp-template --force
```

### Example 6: Add scratch to an existing project

```bash
cd my-existing-project
scratch init all  # install slash commands
# /scratch:doctor, /scratch:list, etc. now available
```

## Cross-Platform

`scratch` is written in pure Node.js and runs on:

- ✅ Windows 10/11
- ✅ macOS 12+
- ✅ Linux (Ubuntu, Debian, Fedora, Arch, etc.)
- ✅ WSL (Windows Subsystem for Linux)

The CLI uses cross-platform APIs (`path.join`, `fs`, `https`) and detects the home directory via `HOME` or `USERPROFILE`.

Config location:
- **Windows**: `%USERPROFILE%\.scratch\`
- **Linux/macOS**: `~/.scratch/`

## Troubleshooting

### `scratch: command not found`

Your `bin` directory is not in `PATH`.

**Linux/macOS:**
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**
```powershell
$binDir = "$env:USERPROFILE\bin"
[System.Environment]::SetEnvironmentVariable('Path', "$binDir;$([System.Environment]::GetEnvironmentVariable('Path', 'User'))", 'User')
```

Then open a new terminal.

### `Cannot find module 'commander'` or similar

Run `npm install` inside the cloned repo:

```bash
cd ~/.scratch-cli  # or wherever you cloned it
npm install
```

### `Template not found` after `scratch add`

Run `scratch doctor` to check registry health:

```bash
scratch doctor
```

### `git clone failed` when using a GitHub template

- Make sure the repo exists and is public (or you have access)
- Check your internet connection
- For private repos, configure git credentials: `gh auth login`

### `npx` fails with "could not determine executable to run"

Make sure you have Node.js 16+ and use the `-y` flag:

```bash
npx -y github:jcbarralesq/scratch list
```

## License

[MIT](LICENSE) — JC Barrales
