# ProjectGen Skill for Claude Code

## Description

Template-driven project generator CLI. Create new projects from templates with a single command.

## Commands

### `/gen:init`

Create a new project from a template.

**Usage:** `/gen:init [template-name] [project-name]`

**Options:**
- `--path <path>` - Target directory
- `--force` - Overwrite existing files
- `--no-install` - Skip dependency installation

**Examples:**
```
/gen:init react-app my-project
/gen:init node-api api-service --path ./workspace
```

### `/gen:list`

List available templates in the registry.

**Usage:** `/gen:list [--local] [--remote]`

**Options:**
- `--local` - Show only local templates
- `--remote` - Show only remote templates

**Examples:**
```
/gen:list
/gen:list --remote
```

### `/gen:add`

Add a new template to the registry.

**Usage:** `/gen:add <name> --git <repo>`

**Options:**
- `--git <repo>` - GitHub repository (user/repo)
- `--branch <branch>` - Git branch (default: main)
- `--path <subpath>` - Subdirectory within repo

**Examples:**
```
/gen:add api-rest --git myuser/api-template
/gen:add landing --git myuser/landing --branch develop
```

### `/gen:remove`

Remove a template from the registry.

**Usage:** `/gen:remove <name>`

**Examples:**
```
/gen:remove old-template
```

### `/gen:update`

Update templates from remote sources.

**Usage:** `/gen:update [template-name]`

**Options:**
- `--all` - Update all templates
- `--force` - Force re-download

**Examples:**
```
/gen:update --all
/gen:update my-template --force
```

### `/gen:info`

Show detailed information about a template.

**Usage:** `/gen:info <template-name>`

**Examples:**
```
/gen:info react-app
```

### `/gen:doctor`

Check template registry health.

**Usage:** `/gen:doctor`

## Tool Path

```
~/.mavis/skills/projectgen/bin/gen.js
```

## Configuration

Templates are stored in `~/.projectgen/registry.yaml`

Default config: `~/.projectgen/config.yaml`
