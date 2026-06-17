# ProjectGen: Add

Add a new template to the registry.

## Usage

```
/gen:add <name> --git <repo>
```

## Options

- `--git <repo>` - GitHub repository (user/repo or URL)
- `--branch <branch>` - Git branch (default: main)
- `--path <subpath>` - Subdirectory within repo

## Examples

```
/gen:add api --git myuser/api-template
/gen:add landing --git myuser/landing --branch develop
```

## Script

```javascript
const { execSync } = require('child_process');
const path = require('path');

const SKILL_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.mavis', 'skills', 'projectgen');
const GEN_CLI = path.join(SKILL_DIR, 'bin', 'gen.js');

const args = process.env.CLAUDE_BROWSE_ARGS || '';
const command = `node "${GEN_CLI}" add ${args}`;

try {
  const output = execSync(command, { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log(output);
} catch (error) {
  console.error(error.stdout || error.message);
}
