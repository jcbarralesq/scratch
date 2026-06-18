#!/usr/bin/env node

/**
 * Scratch CLI - Template-driven project generator
 * Inspired by OpenSpec's command structure
 * "Build your next project from scratch"
 */

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const yaml = require('js-yaml');
const chalk = require('chalk');
const inquirer = require('inquirer');
const commandGen = require('./command-generator');

// Get config directory
const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.scratch');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yaml');
const REGISTRY_FILE = path.join(CONFIG_DIR, 'registry.yaml');
const TEMPLATES_DIR = path.join(CONFIG_DIR, 'templates');

// Ensure config directory exists
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
}

// Load config
function loadConfig() {
  ensureConfigDir();
  if (fs.existsSync(CONFIG_FILE)) {
    return yaml.load(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return getDefaultConfig();
}

// Save config
function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, yaml.dump(config));
}

// Load registry — always reads from the bundled registry/default.yaml
// (Option 1: no local cache, every run is fresh from the repo)
function loadRegistry() {
  const defaultRegistry = getDefaultRegistry();
  if (defaultRegistry) {
    return defaultRegistry;
  }
  return { templates: [] };
}

// Save registry — writes to the bundled registry/default.yaml
// (so changes propagate when the user commits and pushes)
function saveRegistry(registry) {
  const defaultPath = path.join(__dirname, '..', 'registry', 'default.yaml');
  fs.writeFileSync(defaultPath, yaml.dump(registry));
}

// Get default registry shipped with the CLI
function getDefaultRegistry() {
  const defaultPath = path.join(__dirname, '..', 'registry', 'default.yaml');
  if (fs.existsSync(defaultPath)) {
    try {
      return yaml.load(fs.readFileSync(defaultPath, 'utf8'));
    } catch (err) {
      // ignore parse errors
    }
  }
  return null;
}

// Default config
function getDefaultConfig() {
  return {
    registry: {
      local: TEMPLATES_DIR,
      remote: {
        github: {
          defaultBranch: 'main'
        }
      },
      sources: []
    },
    defaults: {
      template: '',
      installDeps: true
    },
    behavior: {
      autoUpdate: false,
      confirmOverwrite: true
    }
  };
}

// Colors
const colors = {
  primary: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  dim: chalk.gray,
  bold: chalk.bold
};

// Print helpers
function printSuccess(msg) {
  console.log(colors.success('✓') + ' ' + msg);
}

function printError(msg) {
  console.error(colors.error('✗') + ' ' + msg);
}

function printWarning(msg) {
  console.log(colors.warning('⚠') + ' ' + msg);
}

function printInfo(msg) {
  console.log(colors.primary('ℹ') + ' ' + msg);
}

// Clone git repository
async function cloneRepo(repo, dest, options = {}) {
  const { branch = 'main', depth = 1 } = options;
  
  // Parse repo format
  let repoUrl = repo;
  if (!repo.startsWith('http') && !repo.startsWith('git@')) {
    repoUrl = `https://github.com/${repo}.git`;
  }
  
  return new Promise((resolve, reject) => {
    const args = ['clone'];
    if (depth) args.push('--depth', depth.toString());
    if (branch) args.push('--branch', branch);
    args.push(repoUrl, dest);
    
    const { exec } = require('child_process');
    const proc = exec(`git ${args.join(' ')}`, { cwd: path.dirname(dest) });
    
    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data; });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `git clone failed with code ${code}`));
    });
    proc.on('error', reject);
  });
}

// Download GitHub repo as tarball
async function downloadRepo(repo, dest, options = {}) {
  const { branch = 'main', subpath = '' } = options;
  
  // Use git clone — much more reliable than downloading zips from GitHub
  // Handles private repos (with credentials), redirects, subpaths via sparse checkout
  const { exec } = require('child_process');
  
  // Parse repo format
  let repoUrl = repo;
  if (!repo.startsWith('http') && !repo.startsWith('git@') && repo.includes('/')) {
    repoUrl = `https://github.com/${repo}.git`;
  }
  
  const tempDir = path.join(CONFIG_DIR, 'temp-clone-' + Date.now());
  
  try {
    // Clone the repo
    await new Promise((resolve, reject) => {
      const args = [
        'clone',
        '--depth', '1',
        '--branch', branch,
        repoUrl,
        tempDir
      ];
      const proc = exec(`git ${args.map(a => `"${a}"`).join(' ')}`, { 
        cwd: path.dirname(tempDir),
        maxBuffer: 1024 * 1024 * 100
      });
      let stderr = '';
      proc.stderr.on('data', (data) => { stderr += data; });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`git clone failed (exit ${code}): ${stderr.trim() || 'unknown error'}`));
      });
      proc.on('error', reject);
    });
    
    // Determine source path within the cloned repo
    const sourcePath = subpath 
      ? path.join(tempDir, subpath)
      : tempDir;
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Path not found in repo: ${subpath || '(root)'}`);
    }
    
    // Copy to dest
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.mkdirSync(dest, { recursive: true });
    copyDir(sourcePath, dest);
    
  } finally {
    // Cleanup temp clone
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// Copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Main CLI
async function main() {
  const program = new Command();
  
  program
    .name('scratch')
    .description('From Scratch CLI - Build your next project from scratch')
    .version('1.0.0')
    .option('--no-color', 'Disable color output')
    .hook('preAction', (thisCommand) => {
      if (thisCommand.opts().noColor) {
        chalk.level = 0;
      }
    });
  
  // === scratch new (was: gen init) ===
  program
    .command('new [template] [project-name]')
    .description('Create a new project from a template (in current dir with --here)')
    .option('-p, --path <path>', 'Target directory')
    .option('--here', 'Create in current directory (instead of a subfolder)')
    .option('-f, --force', 'Overwrite existing files')
    .option('--no-install', 'Skip dependency installation')
    .option('-t, --template <source>', 'Use a specific template source')
    .option('-i, --integration <editor>', 'Install slash commands for editor (claude, cursor, vscode, all)')
    .option('--no-commands', 'Skip installing slash commands')
    .action(async (template, projectName, options) => {
      const config = loadConfig();
      const registry = loadRegistry();
      
      // If no template provided, show interactive selection
      if (!template) {
        const templates = registry.templates.map(t => ({
          name: t.name,
          value: t.name,
          description: `${t.source === 'github' ? '🌐' : '📁'} ${t.repo || t.path || 'Local'}`
        }));
        
        if (templates.length === 0) {
          printError('No templates found. Add one with: scratch add <name>');
          process.exit(2);
        }
        
        const questions = [
          {
            type: 'list',
            name: 'template',
            message: 'Select a template:',
            choices: templates
          }
        ];
        
        if (!options.here) {
          questions.push({
            type: 'input',
            name: 'projectName',
            message: 'Project name:',
            validate: (input) => /^[a-z][a-z0-9-]*$/.test(input) || 'Use kebab-case (e.g., my-project)'
          });
          questions.push({
            type: 'input',
            name: 'path',
            message: 'Target directory:',
            default: './'
          });
        }
        
        questions.push({
          type: 'list',
          name: 'integration',
          message: 'Install slash commands for:',
          choices: [
            { name: 'All editors (Claude Code, Cursor, VSCode)', value: 'all' },
            { name: 'Claude Code only', value: 'claude' },
            { name: 'Cursor only', value: 'cursor' },
            { name: 'VSCode only', value: 'vscode' },
            { name: 'Skip (no editor integration)', value: 'none' }
          ],
          default: 'all'
        });
        
        const answers = await inquirer.prompt(questions);
        
        template = answers.template;
        projectName = answers.projectName;
        options.path = answers.path;
        options.integration = answers.integration === 'none' ? false : answers.integration;
      }
      
      // Find template in registry
      const templateEntry = registry.templates.find(t => t.name === template);
      if (!templateEntry) {
        printError(`Template "${template}" not found. Add it with: scratch add ${template}`);
        process.exit(2);
      }
      
      // Determine source path
      let sourcePath;
      if (templateEntry.source === 'local') {
        sourcePath = templateEntry.path;
      } else if (templateEntry.source === 'github') {
        sourcePath = path.join(TEMPLATES_DIR, template);
        if (!fs.existsSync(sourcePath)) {
          printInfo(`Downloading template "${template}"...`);
          try {
            await downloadRepo(templateEntry.repo, sourcePath, {
              branch: templateEntry.branch,
              subpath: templateEntry.path
            });
            printSuccess('Template downloaded');
          } catch (err) {
            printError(`Failed to download template: ${err.message}`);
            process.exit(4);
          }
        }
      }
      
      if (!fs.existsSync(sourcePath)) {
        printError(`Template source not found: ${sourcePath}`);
        process.exit(3);
      }
      
      // Create target directory
      let targetPath;
      if (options.here) {
        // Create in current directory
        targetPath = path.resolve(options.path || '.');
        // Check current dir is empty (or only has hidden files)
        const entries = fs.readdirSync(targetPath).filter(name => !name.startsWith('.'));
        if (entries.length > 0 && !options.force) {
          printError(`Current directory is not empty: ${targetPath}`);
          printError('Use --force to merge into existing files, or create a new folder.');
          process.exit(1);
        }
      } else {
        targetPath = path.join(options.path || '.', projectName);
        if (fs.existsSync(targetPath) && !options.force) {
          printError(`Directory "${targetPath}" already exists. Use --force to overwrite.`);
          process.exit(1);
        }
      }
      
      printInfo(`Creating project from template "${template}" in ${targetPath}...`);
      
      // Copy template
      try {
        copyDir(sourcePath, targetPath);
        
        // Process template variables (use current folder name if --here)
        const nameForVars = projectName || path.basename(targetPath);
        await processTemplate(targetPath, {
          project_name: nameForVars,
          project_name_camel: nameForVars.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
          project_name_pascal: nameForVars.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
        });
        
        printSuccess(`Project created at: ${targetPath}`);
        
        // Install slash commands if requested
        if (options.integration && options.integration !== 'none' && options.commands !== false) {
          printInfo(`Installing slash commands for: ${options.integration}`);
          const originalCwd = process.cwd();
          try {
            process.chdir(targetPath);
            const editors = options.integration === 'all' 
              ? ['claude', 'cursor', 'vscode'] 
              : [options.integration];
            
            for (const ed of editors) {
              if (ed === 'claude') {
                installClaudeCommands(path.join(targetPath, '.claude', 'commands'), path.join(__dirname, 'scratch.js'), false);
              } else if (ed === 'cursor') {
                installCursorCommands(path.join(targetPath, '.cursor', 'commands'), path.join(__dirname, 'scratch.js'), false);
              } else if (ed === 'vscode') {
                installVSCodeCommands(path.join(targetPath, '.vscode'), path.join(__dirname, 'scratch.js'), false);
              }
            }
          } finally {
            process.chdir(originalCwd);
          }
        }
        
        // Inject on_new prompt if available
        injectOnNewPrompt(targetPath);
        
        // Install dependencies if requested
        if (options.install !== false) {
          const packageJson = path.join(targetPath, 'package.json');
          if (fs.existsSync(packageJson)) {
            printInfo('Installing dependencies...');
            const { exec } = require('child_process');
            exec('npm install', { cwd: targetPath, stdio: 'inherit' });
          }
        }
        
        console.log();
        printSuccess('All done! Next steps:');
        if (!options.here && projectName) {
          console.log(`  cd ${projectName}`);
        }
        console.log('  Open in your favorite editor');
        console.log('  Use the /scratch:* slash commands');
      } catch (err) {
        printError(`Failed to create project: ${err.message}`);
        process.exit(1);
      }
    });
  
  // === gen list ===
  program
    .command('list')
    .description('List available templates')
    .option('--local', 'Show only local templates')
    .option('--remote', 'Show only remote templates')
    .option('--json', 'Output as JSON')
    .action((options) => {
      const registry = loadRegistry();
      let templates = registry.templates || [];
      
      if (options.local) {
        templates = templates.filter(t => t.source === 'local');
      } else if (options.remote) {
        templates = templates.filter(t => t.source === 'github');
      }
      
      if (options.json) {
        console.log(JSON.stringify(templates, null, 2));
      } else {
        if (templates.length === 0) {
          printWarning('No templates found');
          console.log('  Add a template with: scratch add <name>');
        } else {
          console.log(colors.bold('\nAvailable Templates:\n'));
          for (const t of templates) {
            const icon = t.source === 'github' ? '🌐' : '📁';
            const source = t.repo || t.path || 'Local';
            console.log(`  ${icon} ${colors.bold(t.name)}`);
            console.log(`     ${colors.dim(source)}`);
            if (t.description) {
              console.log(`     ${t.description}`);
            }
            console.log();
          }
        }
      }
    });
  
  // === gen update ===
  program
    .command('update [template]')
    .description('Update templates from remote sources')
    .option('-a, --all', 'Update all templates')
    .option('-f, --force', 'Force re-download')
    .action(async (template, options) => {
      const registry = loadRegistry();
      
      const templatesToUpdate = options.all
        ? registry.templates.filter(t => t.source === 'github')
        : [registry.templates.find(t => t.name === template)].filter(Boolean);
      
      if (templatesToUpdate.length === 0) {
        if (options.all) {
          printInfo('No remote templates to update');
        } else {
          printError(`Template "${template}" not found or not a remote template`);
        }
        return;
      }
      
      for (const t of templatesToUpdate) {
        printInfo(`Updating "${t.name}"...`);
        const destPath = path.join(TEMPLATES_DIR, t.name);
        
        if (fs.existsSync(destPath)) {
          if (options.force) {
            fs.rmSync(destPath, { recursive: true });
          } else {
            printWarning(`"${t.name}" already cached. Use --force to re-download.`);
            continue;
          }
        }
        
        try {
          await downloadRepo(t.repo, destPath, {
            branch: t.branch,
            subpath: t.path
          });
          t.lastUpdated = new Date().toISOString().split('T')[0];
          printSuccess(`"${t.name}" updated`);
        } catch (err) {
          printError(`Failed to update "${t.name}": ${err.message}`);
        }
      }
      
      saveRegistry(registry);
    });
  
  // === gen info ===
  program
    .command('info <template>')
    .description('Show detailed information about a template')
    .option('--json', 'Output as JSON')
    .action((template, options) => {
      const registry = loadRegistry();
      const t = registry.templates.find(t => t.name === template);
      
      if (!t) {
        printError(`Template "${template}" not found`);
        process.exit(2);
      }
      
      if (options.json) {
        console.log(JSON.stringify(t, null, 2));
      } else {
        console.log(colors.bold(`\nTemplate: ${t.name}\n`));
        console.log(`  Source:     ${t.source === 'github' ? '🌐 GitHub' : '📁 Local'}`);
        if (t.repo) console.log(`  Repository: ${t.repo}`);
        if (t.branch) console.log(`  Branch:     ${t.branch}`);
        if (t.path) console.log(`  Subpath:    ${t.path}`);
        console.log(`  Added:      ${t.added}`);
        if (t.lastUpdated) console.log(`  Updated:    ${t.lastUpdated}`);
        console.log();
      }
    });
  
  // === gen templates ===
  program
    .command('templates')
    .description('Show resolved template paths')
    .option('--json', 'Output as JSON')
    .action((options) => {
      const registry = loadRegistry();
      const config = loadConfig();
      
      const templates = registry.templates.map(t => ({
        name: t.name,
        source: t.source,
        path: t.source === 'local' 
          ? t.path 
          : path.join(config.registry.local, t.name)
      }));
      
      if (options.json) {
        console.log(JSON.stringify(templates, null, 2));
      } else {
        console.log(colors.bold('\nTemplate Paths:\n'));
        for (const t of templates) {
          console.log(`  ${colors.bold(t.name)}`);
          console.log(`    ${colors.dim(t.path)}`);
          console.log();
        }
      }
    });
  
  // === gen config ===
  const configCmd = program
    .command('config')
    .description('View and modify settings');
  
  configCmd
    .command('show')
    .option('--global', 'Show global config')
    .option('--local', 'Show local config')
    .action((options) => {
      const config = loadConfig();
      console.log(yaml.dump(config));
    });
  
  configCmd
    .command('set <key> <value>')
    .description('Set a config value')
    .action((key, value) => {
      const config = loadConfig();
      const keys = key.split('.');
      let obj = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      saveConfig(config);
      printSuccess(`Set ${key} = ${value}`);
    });
  
  configCmd
    .command('get <key>')
    .description('Get a config value')
    .action((key) => {
      const config = loadConfig();
      const keys = key.split('.');
      let obj = config;
      for (const k of keys) {
        obj = obj[k];
        if (!obj) break;
      }
      console.log(obj);
    });
  
  configCmd
    .command('edit')
    .description('Open config in editor')
    .action(() => {
      ensureConfigDir();
      const { exec } = require('child_process');
      const editor = process.env.EDITOR || 'notepad';
      exec(`${editor} "${CONFIG_FILE}"`);
    });
  
  // === gen doctor ===
  program
    .command('doctor')
    .description('Check template registry health')
    .option('--json', 'Output as JSON')
    .action((options) => {
      const config = loadConfig();
      const registry = loadRegistry();
      const issues = [];
      const warnings = [];
      
      // Check config directory
      if (!fs.existsSync(CONFIG_DIR)) {
        issues.push('Config directory does not exist');
      }
      
      // Check templates directory
      if (!fs.existsSync(TEMPLATES_DIR)) {
        warnings.push('Templates cache directory does not exist');
      }
      
      // Check templates
      for (const t of registry.templates) {
        if (t.source === 'local' && !fs.existsSync(t.path)) {
          issues.push(`Local template "${t.name}" path not found: ${t.path}`);
        }
        if (t.source === 'github') {
          const cachedPath = path.join(TEMPLATES_DIR, t.name);
          if (!fs.existsSync(cachedPath)) {
            warnings.push(`GitHub template "${t.name}" not cached`);
          }
        }
      }
      
      if (options.json) {
        console.log(JSON.stringify({ issues, warnings }, null, 2));
      } else {
        console.log(colors.bold('\nRegistry Health Check\n'));
        
        if (issues.length === 0 && warnings.length === 0) {
          printSuccess('All checks passed');
        } else {
          for (const issue of issues) {
            printError(issue);
          }
          for (const warning of warnings) {
            printWarning(warning);
          }
        }
        console.log();
      }
    });
  
  // === gen help ===
  program
    .command('help')
    .description('Show help information')
    .action(() => {
      program.help();
    });
  
  // === scratch init (was: setup) ===
  program
    .command('init [editor]')
    .description('Install slash commands for editors (claude, cursor, vscode, all)')
    .option('--global', 'Install globally (default: project)')
    .option('--uninstall', 'Remove installed commands')
    .option('--dry-run', 'Show what would be done without making changes')
    .action(async (editor, options) => {
      const { clack, showBanner, StepTracker } = require('./ui');
      const s = clack.spinner();
      
      // Show banner
      showBanner();
      
      const validEditors = ['claude', 'cursor', 'vscode', 'all'];
      let selectedEditor = editor || 'all';
      
      // Ask for editor if not provided or invalid
      if (!editor) {
        const answer = await clack.select({
          message: 'Which editor do you want to install scratch commands for?',
          options: [
            { value: 'all', label: 'All editors', hint: 'Claude Code, Cursor, and VSCode' },
            { value: 'claude', label: 'Claude Code only', hint: '/scratch:list, /scratch:new, etc.' },
            { value: 'cursor', label: 'Cursor only', hint: 'AI-first code editor' },
            { value: 'vscode', label: 'VS Code only', hint: 'Tasks via Command Palette' }
          ],
          initialValue: 'all'
        });
        if (clack.isCancel(answer)) {
          clack.cancel('Setup cancelled');
          process.exit(0);
        }
        selectedEditor = answer;
      } else if (!validEditors.includes(editor)) {
        clack.log.error(`Unknown editor: ${editor}. Valid: ${validEditors.join(', ')}`);
        process.exit(1);
      }
      
      // Ask for scope if not specified via flag
      let isProject = !options.global;
      if (process.argv.includes('--global')) {
        isProject = false;
      }
      if (!process.argv.includes('--global') && !options.global) {
        const scopeAnswer = await clack.select({
          message: 'Install scope:',
          options: [
            { value: 'project', label: 'This project only', hint: 'Commands installed in current dir' },
            { value: 'global', label: 'Global', hint: 'Commands installed in home dir, work in all projects' }
          ],
          initialValue: 'project'
        });
        if (clack.isCancel(scopeAnswer)) {
          clack.cancel('Setup cancelled');
          process.exit(0);
        }
        isProject = scopeAnswer === 'project';
      }
      
      const home = process.env.HOME || process.env.USERPROFILE;
      const isWindows = process.platform === 'win32';
      const cwd = process.cwd();
      
      // Determine paths
      const targetDirs = {
        claude: isProject 
          ? path.join(cwd, '.claude', 'commands')
          : path.join(home, isWindows ? '' : '', '.claude', 'commands'),
        cursor: isProject
          ? path.join(cwd, '.cursor', 'commands')
          : path.join(home, '.cursor', 'commands'),
        vscode: isProject
          ? path.join(cwd, '.vscode')
          : path.join(home, '.vscode')
      };
      
      // Windows path fix
      if (isWindows && !isProject) {
        targetDirs.claude = path.join(home, '.claude', 'commands');
      }
      
      // Adjust VSCode global path
      if (!isProject) {
        if (isWindows) {
          targetDirs.vscode = path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Code', 'User');
        } else {
          targetDirs.vscode = path.join(home, '.config', 'Code', 'User');
        }
      }
      
      const scratchCliPath = path.join(__dirname, 'scratch.js');
      const targetEditors = selectedEditor === 'all' 
        ? ['claude', 'cursor', 'vscode'] 
        : [selectedEditor];
      
      console.log();
      clack.log.info(`Installing for: ${targetEditors.map(e => {
        if (e === 'claude') return chalk.cyan('Claude Code');
        if (e === 'cursor') return chalk.magenta('Cursor');
        if (e === 'vscode') return chalk.blue('VS Code');
        return e;
      }).join(', ')}`);
      clack.log.info(`Scope: ${isProject ? chalk.green('project') : chalk.yellow('global')}`);
      console.log();
      
      const tracker = new StepTracker('Setup progress');
      targetEditors.forEach(ed => {
        const label = ed === 'claude' ? 'Claude Code' : ed === 'cursor' ? 'Cursor' : 'VS Code';
        tracker.add(ed, `Install ${label} commands`);
      });
      
      for (const ed of targetEditors) {
        const targetDir = targetDirs[ed];
        
        if (options.dryRun) {
          clack.log.info(`[DRY-RUN] Would ${options.uninstall ? 'uninstall' : 'install'} ${ed} commands in: ${targetDir}`);
          tracker.skip(ed, 'dry-run');
          continue;
        }
        
        tracker.start(ed);
        try {
          s.start(`Installing ${ed}...`);
          if (ed === 'claude') {
            installClaudeCommands(targetDir, scratchCliPath, options.uninstall);
          } else if (ed === 'cursor') {
            installCursorCommands(targetDir, scratchCliPath, options.uninstall);
          } else if (ed === 'vscode') {
            installVSCodeCommands(targetDir, scratchCliPath, options.uninstall);
          }
          s.stop(`${ed} ✓`);
          tracker.complete(ed, '9 commands');
        } catch (err) {
          s.stop(`${ed} ✗`, 1);
          tracker.error(ed, err.message);
        }
      }
      
      console.log();
      console.log(tracker.render());
      console.log();
      
      if (options.uninstall) {
        clack.log.success('Commands removed');
      } else {
        clack.log.success('Setup complete!');
        console.log();
        clack.log.step('Restart your editor to load the commands:');
        console.log();
        console.log(`  ${chalk.cyan('Claude Code:')}  /scratch:list`);
        console.log(`  ${chalk.magenta('Cursor:')}       /scratch:list`);
        console.log(`  ${chalk.blue('VS Code:')}       Cmd+Shift+P → "Scratch: ..."`);
        
        // Show available templates and next step
        console.log();
        clack.log.step('Available templates:');
        console.log();
        const registry = loadRegistry();
        if (registry.templates && registry.templates.length > 0) {
          for (const t of registry.templates) {
            const icon = t.source === 'github' ? '🌐' : '📁';
            const source = t.repo || t.path || 'local';
            console.log(`  ${icon} ${chalk.bold(t.name)} ${chalk.gray(`(${source})`)}`);
            if (t.description) {
              console.log(`     ${chalk.dim(t.description)}`);
            }
          }
        } else {
          console.log(chalk.yellow('  No templates registered yet.'));
        }
        
        console.log();
        clack.log.step('Open your AI agent and run:');
        console.log();
        console.log(`  ${chalk.cyan.bold('/scratch:new <template-name> --here')}`);
        console.log();
        console.log(chalk.gray('  This will clone the template into the current directory.'));
        console.log(chalk.gray('  The agent will then read .scratch/INIT_PROMPT.md to continue.'));
      }
    });
  
  // Parse and execute
  program.parse(process.argv);
}

/**
 * Install Claude Code slash commands
 */
function installClaudeCommands(targetDir, scratchCliPath, uninstall) {
  if (uninstall) {
    if (fs.existsSync(targetDir)) {
      const files = fs.readdirSync(targetDir).filter(f => f.startsWith('scratch-') && f.endsWith('.md'));
      for (const f of files) {
        fs.unlinkSync(path.join(targetDir, f));
        printSuccess(`  Removed: ${f}`);
      }
    }
    return;
  }
  
  fs.mkdirSync(targetDir, { recursive: true });
  
  for (const [name, cmd] of Object.entries(commandGen.COMMANDS)) {
    const file = commandGen.generateClaudeCommand(name, cmd);
    const finalContent = file.content.replace(/__SCRATCH_CLI_PATH__/g, scratchCliPath);
    const targetPath = path.join(targetDir, file.filename);
    fs.writeFileSync(targetPath, finalContent);
    printSuccess(`  Created: ${file.filename}`);
  }
}

/**
 * Install Cursor slash commands
 */
function installCursorCommands(targetDir, scratchCliPath, uninstall) {
  if (uninstall) {
    if (fs.existsSync(targetDir)) {
      const files = fs.readdirSync(targetDir).filter(f => f.startsWith('scratch-') && f.endsWith('.md'));
      for (const f of files) {
        fs.unlinkSync(path.join(targetDir, f));
        printSuccess(`  Removed: ${f}`);
      }
    }
    return;
  }
  
  fs.mkdirSync(targetDir, { recursive: true });
  
  for (const [name, cmd] of Object.entries(commandGen.COMMANDS)) {
    const file = commandGen.generateCursorCommand(name, cmd);
    const finalContent = file.content.replace(/__SCRATCH_CLI_PATH__/g, scratchCliPath);
    const targetPath = path.join(targetDir, file.filename);
    fs.writeFileSync(targetPath, finalContent);
    printSuccess(`  Created: ${file.filename}`);
  }
}

/**
 * Install VSCode commands and tasks
 */
function installVSCodeCommands(targetDir, scratchCliPath, uninstall) {
  if (uninstall) {
    // Remove tasks from tasks.json
    const tasksFile = path.join(targetDir, 'tasks.json');
    if (fs.existsSync(tasksFile)) {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (tasks.tasks) {
        tasks.tasks = tasks.tasks.filter(t => !t.label || !t.label.startsWith('Scratch:'));
        fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
        printSuccess('  Cleaned tasks.json');
      }
    }
    return;
  }
  
  fs.mkdirSync(targetDir, { recursive: true });
  
  // Generate tasks.json
  const tasksFile = path.join(targetDir, 'tasks.json');
  let tasksConfig = { version: '2.0.0', tasks: [] };
  
  if (fs.existsSync(tasksFile)) {
    try {
      tasksConfig = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (!tasksConfig.tasks) tasksConfig.tasks = [];
    } catch (e) {
      // ignore parse errors
    }
  }
  
  // Remove existing Scratch tasks
  tasksConfig.tasks = tasksConfig.tasks.filter(t => !t.label || !t.label.startsWith('Scratch:'));
  
  // Add new Scratch tasks
  for (const [name, cmd] of Object.entries(commandGen.COMMANDS)) {
    const task = commandGen.generateVSCodeTask(name, cmd);
    task.command = 'node';
    task.args = [scratchCliPath, name];
    tasksConfig.tasks.push(task);
  }
  
  fs.writeFileSync(tasksFile, JSON.stringify(tasksConfig, null, 2));
  printSuccess(`  Updated: tasks.json (${tasksConfig.tasks.length} tasks)`);
}

// Process template variables
async function processTemplate(dir, variables) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Replace variables in filename
    let newName = entry.name;
    for (const [key, value] of Object.entries(variables)) {
      newName = newName.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    let currentPath = fullPath;
    if (newName !== entry.name) {
      currentPath = path.join(dir, newName);
      fs.renameSync(fullPath, currentPath);
    }
    
    if (entry.isDirectory()) {
      await processTemplate(currentPath, variables);
    } else {
      // Replace variables in file content
      let content = fs.readFileSync(currentPath, 'utf8');
      let modified = false;
      for (const [key, value] of Object.entries(variables)) {
        const newContent = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
      if (modified) {
        fs.writeFileSync(currentPath, content);
      }
    }
  }
}

// Inject on_new prompt into the new project
function injectOnNewPrompt(targetPath) {
  // Priority: user-defined ~/.scratch/on_new.md > bundled prompts/default-on-new.md
  const userPrompt = path.join(CONFIG_DIR, 'on_new.md');
  const defaultPrompt = path.join(__dirname, '..', 'prompts', 'default-on-new.md');
  
  let sourcePath = null;
  if (fs.existsSync(userPrompt)) {
    sourcePath = userPrompt;
    printInfo('Using custom on_new.md from ~/.scratch/');
  } else if (fs.existsSync(defaultPrompt)) {
    sourcePath = defaultPrompt;
  }
  
  if (!sourcePath) return; // no prompt to inject, silent skip
  
  const destDir = path.join(targetPath, '.scratch');
  const destPath = path.join(destDir, 'INIT_PROMPT.md');
  
  try {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(sourcePath, destPath);
    printSuccess('Injected on_new prompt to .scratch/INIT_PROMPT.md');
  } catch (err) {
    printWarning(`Could not inject on_new prompt: ${err.message}`);
  }
}

// Run
main().catch((err) => {
  printError(err.message);
  process.exit(1);
});
