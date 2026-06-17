# ProjectGen: List

List available project templates.

## Usage

```
/gen:list [--local] [--remote]
```

## Options

- `--local` - Show only local templates
- `--remote` - Show only remote templates

## Examples

```
/gen:list
/gen:list --remote
```

## Script

```javascript
const { execSync } = require('child_process');
const path = require('path');

const SKILL_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.mavis', 'skills', 'projectgen');
const GEN_CLI = path.join(SKILL_DIR, 'bin', 'gen.js');

const args = process.env.CLAUDE_BROWSE_ARGS || '';
const command = `node "${GEN_CLI}" list ${args}`;

try {
  const output = execSync(command, { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log(output);
} catch (error) {
  console.error(error.stdout || error.message);
}
