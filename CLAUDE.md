# ProjectGen - Claude Code Integration

## Setup Instructions

### Option 1: Global Slash Commands (Recommended)

Link the commands to your Claude Code configuration:

```bash
# Create the commands directory
mkdir -p ~/.claude/commands

# Link each command
ln -sf ~/.mavis/skills/projectgen/claude/commands/*.md ~/.claude/commands/
```

Or copy manually:
```bash
cp ~/.mavis/skills/projectgen/claude/commands/*.md ~/.claude/commands/
```

### Option 2: Project-Level Commands

For project-specific commands, add them to `.claude/commands/` in your project.

### Option 3: Workspace Skills

If you're using Claude Code workspaces, copy the skill:
```bash
cp -r ~/.mavis/skills/projectgen/claude ~/.claude/skills/projectgen
```

## Available Slash Commands

After setup, these commands will be available:

| Command | Description |
|---------|-------------|
| `/gen:init` | Create a new project from a template |
| `/gen:list` | List available templates |
| `/gen:add` | Add a template to the registry |
| `/gen:remove` | Remove a template |
| `/gen:update` | Update templates |

## Quick Start

1. Link commands: `ln -sf ~/.mavis/skills/projectgen/claude/commands/*.md ~/.claude/commands/`
2. Restart Claude Code
3. Use `/gen:list` to see available templates
4. Use `/gen:add <name> --git user/repo` to add templates
5. Use `/gen:init <template> <project-name>` to create projects

## Troubleshooting

If commands don't appear:
- Make sure the `.md` files are in `~/.claude/commands/`
- Restart Claude Code
- Check file permissions: `ls -la ~/.claude/commands/`
