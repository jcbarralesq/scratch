const fs = require('fs');
const path = require('path');

/**
 * Generate command files for various editors (Claude Code, Cursor, VSCode)
 */

const SCRATCH_CLI_PATH_PLACEHOLDER = '__SCRATCH_CLI_PATH__';

// Command definitions
const COMMANDS = {
  init: {
    description: 'Create a new project from a template',
    usage: '/scratch:init [template] [project-name] [options]'
  },
  list: {
    description: 'List available templates',
    usage: '/scratch:list [options]'
  },
  add: {
    description: 'Add a template to the registry',
    usage: '/scratch:add <name> --git <repo>'
  },
  remove: {
    description: 'Remove a template from the registry',
    usage: '/scratch:remove <name>'
  },
  update: {
    description: 'Update templates from remote sources',
    usage: '/scratch:update [template] [options]'
  },
  info: {
    description: 'Show detailed information about a template',
    usage: '/scratch:info <template>'
  },
  templates: {
    description: 'Show resolved template paths',
    usage: '/scratch:templates'
  },
  config: {
    description: 'View and modify settings',
    usage: '/scratch:config <action>'
  },
  doctor: {
    description: 'Check template registry health',
    usage: '/scratch:doctor'
  }
};

/**
 * Generate Claude Code command file
 */
function generateClaudeCommand(name, cmd) {
  const body = `# /scratch:${name}

${cmd.description}

## Usage

\`\`\`
${cmd.usage}
\`\`\`

## Script

This command executes the scratch CLI:

\`\`\`bash
node "${SCRATCH_CLI_PATH_PLACEHOLDER}" ${name} $ARGUMENTS
\`\`\`
`;

  return {
    filename: `scratch-${name}.md`,
    content: body
  };
}

/**
 * Generate Cursor command file
 */
function generateCursorCommand(name, cmd) {
  const body = `---
description: ${cmd.description}
---

# /scratch:${name}

${cmd.description}

## Usage

\`\`\`
${cmd.usage}
\`\`\`

## Implementation

This command runs the scratch CLI directly. Arguments are passed through.

\`\`\`bash
node "${SCRATCH_CLI_PATH_PLACEHOLDER}" ${name} $ARGUMENTS
\`\`\`
`;

  return {
    filename: `scratch-${name}.md`,
    content: body
  };
}

/**
 * Generate VSCode command file
 * VSCode uses commandName in package.json + a TypeScript/JavaScript implementation
 */
function generateVSCodeCommand(name, cmd) {
  const body = `// VSCode command: scratch.${name}
// Description: ${cmd.description}
// Usage: scratch.${name}

import { exec } from 'child_process';
import * as vscode from 'vscode';

export function registerScratch${name.charAt(0).toUpperCase() + name.slice(1)}Command(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(\`scratch.${name}\`, async (args) => {
    const terminal = vscode.window.createTerminal('Scratch ${name}');
    const argString = args && args.length > 0 ? ' ' + args.join(' ') : '';
    terminal.sendText(\`node "${SCRATCH_CLI_PATH_PLACEHOLDER}" ${name}\${argString}\`);
    terminal.show();
  });
  context.subscriptions.push(disposable);
}
`;

  return {
    filename: `scratch.${name}.js`,
    content: body
  };
}

/**
 * Generate VSCode tasks.json entry
 */
function generateVSCodeTask(name, cmd) {
  return {
    label: `Scratch: ${cmd.description}`,
    type: 'shell',
    command: 'node',
    args: [
      SCRATCH_CLI_PATH_PLACEHOLDER,
      name
    ],
    problemMatcher: [],
    presentation: {
      reveal: 'always',
      panel: 'new'
    }
  };
}

module.exports = {
  COMMANDS,
  generateClaudeCommand,
  generateCursorCommand,
  generateVSCodeCommand,
  generateVSCodeTask
};
