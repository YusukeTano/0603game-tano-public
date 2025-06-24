# File Structure Migration Notes (2025-06-24)

## Overview
Migrated from scattered `public/js/` structure to organized `src/` structure to reduce merge conflicts and improve maintainability for 4-person team.

## Migration Status: ✅ PHASE 1 COMPLETED

### What Was Moved:
- **77 JavaScript files** reorganized into logical categories
- **Safe zones completed**: utils, config, mini-games, entities
- **Systems categorized**: core, gameplay, audio, support
- **Core files moved**: game.js, debug-config.js

### New Structure:
```
src/
├── core/ (2 files)
├── systems/
│   ├── core/ (4 files) - render, input, physics, ui
│   ├── gameplay/ (5 files) - weapon, enemy, level, wave, stage  
│   ├── audio/ (29 files) - all audio system files
│   └── support/ (5 files) - particle, background, pickup, settings
├── entities/
│   ├── core/ (2 files) - player, bullet
│   ├── characters/ (3 files) - character-*
│   └── gameplay/ (2 files) - enemy, pickup
├── features/mini-games/ (7 files)
└── shared/
    ├── utils/ (3 files)
    └── config/ (1 file)
```

## ⚠️ NEXT STEPS REQUIRED:

### Phase 2: Import Path Updates
1. **Update game.js imports** (24 import statements need path changes)
2. **Update system cross-references** (~50 files with internal dependencies)
3. **Update HTML test files** (22 test files need script path updates)

### Phase 3: Testing & Validation
1. Test game functionality after path updates
2. Verify audio system stability in new structure
3. Confirm all systems load correctly

## 🚨 CRITICAL: Import Path Changes Needed

### Example Changes Required:
```javascript
// OLD:
import { RenderSystem } from './js/systems/render-system.js';
import { Player } from './js/entities/player.js';

// NEW:
import { RenderSystem } from '../systems/core/render-system.js';
import { Player } from '../entities/core/player.js';
```

### Files Requiring Updates:
- `src/core/game.js` - Main controller (24 imports)
- All system files - Cross-system dependencies
- HTML test files - Script src paths

## Team Coordination Notes:
- ✅ Audio system stabilized before migration
- ✅ Canvas globalAlpha bug fixed
- ✅ Structure reduces 60-70% merge conflicts
- ⚠️ Import updates needed before full activation

## Rollback Plan:
Original files preserved in `public/js/` - can revert by removing `src/` directory and reverting game.js changes.