# ProjectGen CLI - Template-driven project generator

## Overview

ProjectGen is a CLI tool for creating new projects from templates. Inspired by OpenSpec's command structure, it provides terminal commands for managing templates, initializing projects, and maintaining a local template registry.

## Commands

### `gen init`

Create a new project from a template.

```
gen init [template-name] [project-name] [options]
```

**Options:**
- `--path <path>` - Target directory (default: current directory)
- `--force` - Overwrite existing files
- `--no-install` - Skip dependency installation
- `--template <source>` - Use a specific template source

**Examples:**
```
gen init                    # Interactive mode
gen init react-app          # Use 'react-app' template
gen init react-app my-project --force
gen init typescript-lib my-lib --path ./workspace
```

### `gen list`

List available templates.

```
gen list [options]
```

**Options:**
- `--local` - Show only local templates
- `--remote` - Show only remote templates
- `--json` - Output as JSON

**Examples:**
```
gen list                    # Show all templates
gen list --local            # Show local templates only
gen list --remote           # Show remote templates only
gen list --json             # JSON output for scripts
```

### `gen add`

Add a new template to the registry.

```
gen add <name> [options]
```

**Options:**
- `--source <path|url>` - Local path or GitHub URL
- `--git <repo>` - GitHub repository (e.g., "user/repo" or full URL)
- `--branch <branch>` - Git branch (default: main)
- `--path <subpath>` - Subdirectory within repo

**Examples:**
```
gen add my-template --git user/my-template-repo
gen add api --git https://github.com/user/api-template --branch develop
gen add local-template --source ./my-templates/node-api
```

### `gen remove`

Remove a template from the registry.

```
gen remove <name> [options]
```

**Options:**
- `--yes` - Skip confirmation

**Examples:**
```
gen remove old-template
gen remove old-template --yes
```

### `gen update`

Update templates from remote sources.

```
gen update [template-name] [options]
```

**Options:**
- `--all` - Update all templates
- `--force` - Force re-download

**Examples:**
```
gen update                     # Update all templates
gen update my-template        # Update specific template
gen update --all --force       # Force refresh all
```

### `gen info`

Show detailed information about a template.

```
gen info <template-name> [options]
```

**Options:**
- `--json` - Output as JSON

**Examples:**
```
gen info react-app
gen info my-template --json
```

### `gen templates`

Show resolved template paths.

```
gen templates [options]
```

**Options:**
- `--json` - Output as JSON

**Examples:**
```
gen templates
gen templates --json
```

### `gen config`

View and modify settings.

```
gen config [action] [options]
```

**Actions:**
- `show` - Display current config
- `edit` - Open config in editor
- `set <key> <value>` - Set a config value
- `get <key>` - Get a config value

**Options:**
- `--global` - Use global config
- `--local` - Use project config (default)

**Examples:**
```
gen config show
gen config show --global
gen config set defaultTemplate react-app
gen config get defaultTemplate
gen config edit
```

### `gen doctor`

Check template registry health.

```
gen doctor [options]
```

**Options:**
- `--json` - Output as JSON

**Examples:**
```
gen doctor
gen doctor --json
```

## Global Options

- `--version`, `-V` - Show version
- `--help`, `-h` - Display help
- `--no-color` - Disable color output
- `--verbose` - Verbose output

## Configuration

Configuration file location: `~/.projectgen/config.yaml`

**Default config:**
```yaml
registry:
  local: ~/.projectgen/templates
  remote:
    github:
      defaultBranch: main
  sources: []

defaults:
  template: ""
  installDeps: true

behavior:
  autoUpdate: false
  confirmOverwrite: true
```

## Template Structure

A template repository should have:

```
template-name/
├── template.yaml          # Template metadata
├── README.md             # Template documentation
└── template/             # Actual template files
    ├── {{project_name}}/  # Project files (with variable substitution)
    │   ├── package.json
    │   └── ...
    └── ...
```

### template.yaml Example

```yaml
name: my-template
description: A React TypeScript template
version: 1.0.0
author: Your Name

variables:
  project_name:
    description: "Project name (kebab-case)"
    pattern: "^[a-z][a-z0-9-]*$"
    required: true
  description:
    description: "Project description"
    default: "A new project"

files:
  - template/package.json
  - template/tsconfig.json
  - template/src/index.ts

scripts:
  install: npm install
  start: npm run dev
```

## Registry Format

Templates are stored in `~/.projectgen/registry.yaml`:

```yaml
templates:
  - name: react-app
    source: github
    repo: user/react-template
    branch: main
    path: template
    added: 2024-01-15
    lastUpdated: 2024-01-20

  - name: node-api
    source: local
    path: /Users/user/templates/node-api
    added: 2024-01-10
```

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Template not found
- `3` - Invalid template format
- `4` - Network error
- `5` - Configuration error
