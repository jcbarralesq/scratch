# ProjectGen: Update

Update templates from remote sources.

## Usage

```
/gen:update [template] [--all] [--force]
```

## Options

- `--all` - Update all templates
- `--force` - Force re-download

## Examples

```
/gen:update
/gen:update --all
/gen:update my-template --force
```

## Script

```javascript
const { execSync } = require('child_process');
const path = require('path');

const SKILL_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.mavis', 'skills', 'projectgen');
const GEN_CLI = path.join(SKILL_DIR, 'bin', 'gen.js');

const args = process.env.CLAUDE_BROWSE_ARGS || '';
const command = `node "${GEN_CLI}" update ${args}`;

try {
  const output = execSync(command, { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log(output);
} catch (error) {
  console.error(error.stdout || error.message);
}
