/**
 * Rich UI helpers for scratch CLI
 * Inspired by github/spec-kit's Python `rich` + `typer` console
 */

const clack = require('@clack/prompts');
const ora = require('ora');
const chalk = require('chalk');

// ASCII banner — "FROM SCRATCH" stylized
const BANNER = `
███████╗██████╗  ██████╗ ███╗   ███╗    ███████╗ ██████╗██████╗  █████╗ ████████╗ ██████╗██╗  ██╗
██╔════╝██╔══██╗██╔═══██╗████╗ ████║    ██╔════╝██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║  ██║
█████╗  ██████╔╝██║   ██║██╔████╔██║    ███████╗██║     ██████╔╝███████║   ██║   ██║     ███████║
██╔══╝  ██╔══██╗██║   ██║██║╚██╔╝██║    ╚════██║██║     ██╔══██╗██╔══██║   ██║   ██║     ██╔══██║
██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║    ███████║╚██████╗██║  ██║██║  ██║   ██║   ╚██████╗██║  ██║
╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝    ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
`;

const TAGLINE = 'Build your next project from scratch';

/**
 * Show banner with gradient color (cyan to white)
 */
function showBanner() {
  const lines = BANNER.trim().split('\n');
  const colors = [
    chalk.cyanBright,
    chalk.cyan,
    chalk.blueBright,
    chalk.blue,
    chalk.whiteBright,
    chalk.white
  ];
  console.log();
  lines.forEach((line, i) => {
    const color = colors[i % colors.length];
    console.log(color(line));
  });
  console.log();
  console.log(chalk.italic.yellow(TAGLINE));
  console.log();
}

/**
 * Step tracker — tracks and renders a list of steps with status
 * States: pending, running, done, error, skipped
 */
class StepTracker {
  constructor(title) {
    this.title = title;
    this.steps = [];
  }

  add(key, label) {
    if (!this.steps.find(s => s.key === key)) {
      this.steps.push({ key, label, status: 'pending', detail: '' });
    }
  }

  start(key, detail = '') {
    this._update(key, 'running', detail);
  }

  complete(key, detail = '') {
    this._update(key, 'done', detail);
  }

  error(key, detail = '') {
    this._update(key, 'error', detail);
  }

  skip(key, detail = '') {
    this._update(key, 'skipped', detail);
  }

  _update(key, status, detail) {
    const step = this.steps.find(s => s.key === key);
    if (step) {
      step.status = status;
      if (detail) step.detail = detail;
    } else {
      this.steps.push({ key, label: key, status, detail });
    }
  }

  render() {
    const lines = [chalk.cyan.bold(this.title)];
    for (const step of this.steps) {
      let symbol;
      let labelColor;
      switch (step.status) {
        case 'done':
          symbol = chalk.green('●');
          labelColor = chalk.white;
          break;
        case 'running':
          symbol = chalk.cyan('○');
          labelColor = chalk.cyan;
          break;
        case 'error':
          symbol = chalk.red('●');
          labelColor = chalk.red;
          break;
        case 'skipped':
          symbol = chalk.yellow('○');
          labelColor = chalk.gray;
          break;
        case 'pending':
        default:
          symbol = chalk.gray('○');
          labelColor = chalk.gray;
          break;
      }
      const detail = step.detail ? chalk.gray(` (${step.detail})`) : '';
      lines.push(`  ${symbol} ${labelColor(step.label)}${detail}`);
    }
    return lines.join('\n');
  }
}

/**
 * Show banner, then run a function with step tracking
 */
async function withSteps(title, stepDefinitions, fn) {
  showBanner();
  const tracker = new StepTracker(title);
  
  // Initialize all steps
  for (const def of stepDefinitions) {
    tracker.add(def.key, def.label);
  }
  
  console.log(tracker.render());
  console.log();
  
  return await fn(tracker);
}

module.exports = {
  clack,
  ora,
  chalk,
  showBanner,
  StepTracker,
  withSteps,
  BANNER,
  TAGLINE
};
