const fs = require('fs');
const path = require('path');

/**
 * Generate command files for various editors (Claude Code, Cursor, VSCode)
 */

const SCRATCH_CLI_PATH_PLACEHOLDER = '__SCRATCH_CLI_PATH__';

// Commands that should pass --here by default (work in current directory)
const HERE_COMMANDS = ['new'];

// Map of command → specific prompt file (instead of generic PREAMBLE)
const PROMPT_FILE = {
  new: 'INIT_PROMPT.md',
  update: 'UPDATE_PROMPT.md'
};

// Generic preamble for commands without a specific prompt file
const PREAMBLE = `> ⚠️ **Antes de responder:** Si existe un prompt de scratch (\`.scratch/*_PROMPT.md\`) en este proyecto, leélo primero y seguí esas instrucciones.

`;

// Command definitions
const COMMANDS = {
  new: {
    description: 'Create a new project from a template (in current dir)',
    usage: '/scratch:new <template> [options]'
  },
  list: {
    description: 'List available templates',
    usage: '/scratch:list [options]'
  },
  update: {
    description: 'Check for new skills relevant to this project',
    usage: '/scratch:update'
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
  const hereFlag = HERE_COMMANDS.includes(name) ? ' --here' : '';
  const promptFile = PROMPT_FILE[name];
  const preamble = promptFile
    ? `> ⚠️ **Antes de responder:** Si existe \`.scratch/${promptFile}\` en este proyecto, leélo primero y seguí esas instrucciones.\n\n`
    : PREAMBLE;
  const body = `${preamble}# /scratch:${name}

${cmd.description}

## Usage

\`\`\`
${cmd.usage}
\`\`\`

## Script

This command executes the scratch CLI:

\`\`\`bash
node "${SCRATCH_CLI_PATH_PLACEHOLDER}" ${name}${hereFlag} $ARGUMENTS
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
  const hereFlag = HERE_COMMANDS.includes(name) ? ' --here' : '';
  const promptFile = PROMPT_FILE[name];
  const preamble = promptFile
    ? `> ⚠️ **Antes de responder:** Si existe \`.scratch/${promptFile}\` en este proyecto, leélo primero y seguí esas instrucciones.\n\n`
    : PREAMBLE;
  const body = `---
description: ${cmd.description}
---

${preamble}# /scratch:${name}

${cmd.description}

## Usage

\`\`\`
${cmd.usage}
\`\`\`

## Implementation

This command runs the scratch CLI directly. Arguments are passed through.

\`\`\`bash
node "${SCRATCH_CLI_PATH_PLACEHOLDER}" ${name}${hereFlag} $ARGUMENTS
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
  const cmdName = HERE_COMMANDS.includes(name) ? `${name} --here` : name;
  return {
    label: `Scratch: ${cmd.description}`,
    type: 'shell',
    command: 'node',
    args: [
      SCRATCH_CLI_PATH_PLACEHOLDER,
      cmdName
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
