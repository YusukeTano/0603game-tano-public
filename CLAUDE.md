# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based game called "スターコレクター PLUS" (Star Collector PLUS) - a static HTML/CSS/JavaScript game with no build process or external dependencies.

## Development Commands

Since this is a pure static site, there are no build commands. Development workflow:

1. **Run locally**: Open `public/index.html` directly in a web browser
2. **Deploy**: Push to `main` branch (GitHub Actions automatically deploys to S3)

## Architecture

### File Structure
- `public/index.html` - Complete game implementation (all CSS/JS inline)
- `public/error.html` - Custom error page with animations
- `.github/workflows/deploy-to-s3.yml` - Automated S3 deployment

### Key Technical Details
- **No build process** - Direct HTML/CSS/JavaScript
- **No dependencies** - Everything is self-contained
- **Audio**: Uses Web Audio API for dynamic sound generation
- **Graphics**: Canvas API for game rendering
- **Controls**: Mouse and touch support

### Deployment
- Automatic deployment via GitHub Actions on push to `main`
- Deploys to S3 bucket: `s3://tano-0603game-bucket/`
- Uses AWS OIDC for authentication (no stored secrets)

### Game Systems
The game implements several interconnected systems in `index.html`:
- **Player movement**: Mouse/touch tracking with trail effect
- **Star spawning**: Dynamic count based on level and score
- **Power-up system**: 7 types with different effects
- **Combo system**: Time-based consecutive collection bonuses
- **Level progression**: Score-based with increasing difficulty
- **Music phases**: Changes every 10 seconds with Web Audio API
- **Particle effects**: Performance-optimized with automatic cleanup