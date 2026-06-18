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

The recommended flow: install globally, then run `scratch init` in an empty directory, open it in your AI-powered editor, and use the `/scratch:new` command from inside the agent.

```bash
# 1. Install scratch globally
npm install -g github:jcbarralesq/scratch

# 2. Create an empty directory for your new project
mkdir my-new-project
cd my-new-project

# 3. Install scratch slash commands in this directory
scratch init
# (or via npx if you prefer not to install: npx -y github:jcbarralesq/scratch init)

# 4. Open the directory in your AI-powered editor
code .         # or: cursor .   or: claude

# 5. In the agent, run:
/scratch:new mcp-template
# This clones the template into the current directory
# and injects .scratch/INIT_PROMPT.md for the agent to follow.
```

The `init` command shows a banner, asks which editor(s) to install for (Claude Code, Cursor, VS Code), and lists the available templates at the end.

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
| `scratch init [editor]` | Install slash commands in the current directory |
| `scratch list` | List available templates |
| `scratch new <template> --here` | Clone a template into the current directory |
| `scratch update [name]` | Update a template's local cache from remote |
| `scratch info <template>` | Show details about a template |
| `scratch templates` | Show resolved paths for all templates |
| `scratch config <action>` | View and modify settings |
| `scratch doctor` | Check registry health |

Run `scratch --help` for the full reference.

> The template registry is managed by editing `registry/default.yaml` directly and committing/pushing. There are no `add`/`remove` CLI commands — templates are read-only from the skill bundle.

## Working with Templates

### Listing templates

```bash
scratch list                # human-readable
scratch list --json         # JSON output for scripts
```

Templates are defined in `registry/default.yaml` and bundled with the CLI. To add or remove templates, edit that file directly and commit/push.

### Creating a project (from your AI agent)

The recommended flow runs through the AI agent:

```
# 1. Install slash commands in your empty directory
cd my-new-project
scratch init

# 2. Open in your editor
code .    # or: cursor .  or: claude

# 3. From the agent, run:
/scratch:new mcp-template --here
```

The slash command calls `scratch new <template> --here` which:

1. Clones the template into the current directory (no subfolder)
2. Processes template variables (`{{project_name}}`, etc.)
3. Injects `.scratch/INIT_PROMPT.md` for the agent to follow

### Creating a project (from CLI directly)

You can also run `new` from the terminal:

```bash
# Clone into the current directory
scratch new mcp-template --here

# Skip dependency install
scratch new mcp-template --here --no-install

# Skip injecting the prompt
scratch new mcp-template --here --no-commands
```

### Template variables

Inside your template files, use `{{variable}}` placeholders. They will be replaced when the project is created.

| Variable | Example | Description |
|----------|---------|-------------|
| `{{project_name}}` | `my-project` | Kebab-case project name (uses folder name when `--here`) |
| `{{project_name_camel}}` | `myProject` | camelCase version |
| `{{project_name_pascal}}` | `MyProject` | PascalCase version |

## Editor Integration

`scratch init [editor]` installs slash commands in your project. It shows a banner, asks which editor(s) to install for interactively, then displays the available templates and the next command to run in your agent.

Editor is one of:

- `claude` — Claude Code
- `cursor` — Cursor
- `vscode` — Visual Studio Code
- `all` — all of the above (default)

```bash
# Interactive (default)
scratch init

# Explicit
scratch init all
scratch init claude
scratch init cursor
scratch init vscode

# Global install (for all projects)
scratch init all --global

# Preview without making changes
scratch init all --dry-run

# Remove
scratch init all --uninstall
```

After `init`, in your editor run the agent and use:

```
/scratch:new <template> --here
```

The `--here` flag is automatic for the `new` command — it clones the template into the current directory.

### Claude Code

Installs slash commands in `.claude/commands/`:

```
.claude/commands/
├── scratch-new.md
├── scratch-list.md
├── scratch-update.md
├── scratch-info.md
├── scratch-templates.md
├── scratch-config.md
└── scratch-doctor.md
```

### Cursor

Same structure as Claude Code, but installed in `.cursor/commands/`.

### VS Code

Updates `.vscode/tasks.json` with shell tasks labeled "Scratch: ...". Run them via `Ctrl+Shift+P` → "Tasks: Run Task".

## Usage Examples

### Example 1: Full flow with the AI agent

```bash
mkdir mi-proyecto && cd mi-proyecto
scratch init                    # install slash commands
code .                          # or: cursor . / claude
# In the agent: /scratch:new mcp-template
# → clones the template here, agent continues with .scratch/INIT_PROMPT.md
```

### Example 2: Use from CI / scripts (non-interactive)

```bash
# Use npx from GitHub — no install needed
npx -y github:jcbarralesq/scratch init all < /dev/null
npx -y github:jcbarralesq/scratch new mcp-template --here --no-install
```

### Example 3: Update the template cache

```bash
scratch update mcp-template        # update a specific template
scratch update --all               # update all remote templates
scratch update mcp-template --force # force re-download
```

### Example 4: Add scratch to an existing project

```bash
cd my-existing-project
scratch init all
# /scratch:doctor, /scratch:list, etc. now available
```

### Example 5: Customize the template registry

Edit `registry/default.yaml` directly:

```bash
# In the skill directory
cd ~/.mavis/skills/from-scratch
vim registry/default.yaml

# Add or remove templates, then commit and push
git add registry/default.yaml
git commit -m "Add new template"
git push
```

Other users will see the changes on their next `npx` run.

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
