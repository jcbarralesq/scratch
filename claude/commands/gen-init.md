# ProjectGen: Init

Create a new project from a template.

## Usage

```
/gen:init [template] [name] [options]
```

## Options

- `--path <path>` - Target directory (default: current)
- `--force` - Overwrite existing files
- `--no-install` - Skip npm install

## Examples

```
/gen:init react-app my-project
/gen:init api-service --path ./projects
```

## Script

```javascript
const { execSync } = require('child_process');
const path = require('path');

const SKILL_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.mavis', 'skills', 'projectgen');
const GEN_CLI = path.join(SKILL_DIR, 'bin', 'gen.js');

const args = process.env.CLAUDE_BROWSE_ARGS || '';
const command = `node "${GEN_CLI}" init ${args}`;

try {
  const output = execSync(command, { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log(output);
} catch (error) {
  console.error(error.stdout || error.message);
}
```
