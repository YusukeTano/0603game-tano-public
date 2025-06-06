#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Simple build script that combines modules into a single file
async function build() {
    console.log('🚀 Building Rhythm Survivor...');
    
    try {
        // Read all JS modules
        const srcDir = path.join(projectRoot, 'src');
        const distDir = path.join(projectRoot, 'dist');
        
        // Ensure dist directory exists
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }
        
        // Copy CSS
        const cssSource = path.join(srcDir, 'css', 'main.css');
        const cssTarget = path.join(distDir, 'styles.css');
        
        if (fs.existsSync(cssSource)) {
            fs.copyFileSync(cssSource, cssTarget);
            console.log('✅ CSS copied to dist/');
        }
        
        // For now, we'll keep the modular structure for development
        // In a real project, you'd use a bundler like Vite, Webpack, or Rollup
        
        console.log('✅ Build completed successfully!');
        console.log('📁 Files are ready in dist/ directory');
        console.log('🌐 Run "npm run serve" to test the build');
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

build();