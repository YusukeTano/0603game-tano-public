#!/usr/bin/env node

/**
 * Phase 5 診断テスト自動実行器
 * テストページの診断ロジックをNode.js環境で実行
 */

const fs = require('fs');
const path = require('path');

class Phase5DiagnosticRunner {
    constructor() {
        this.results = [];
        this.baseDir = __dirname;
    }

    log(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(entry);
        this.results.push({ type, message, timestamp });
    }

    logInfo(message) { this.log('info', message); }
    logSuccess(message) { this.log('success', message); }
    logWarning(message) { this.log('warning', message); }
    logError(message) { this.log('error', message); }

    // ファイル存在確認
    checkFileExistence() {
        this.logInfo('=== ファイル存在確認 ===');
        
        const files = [
            'game.js',
            'js/systems/phase5-integration-controller.js',
            'js/systems/phase5-safe-integration-layer.js',
            'js/systems/phase5-performance-optimizer.js',
            'js/systems/phase5-edge-case-handler.js',
            'js/systems/phase4-audio-facade.js',
            'js/systems/integrated-audio-manager.js'
        ];

        const fileResults = {};
        
        for (const file of files) {
            const filePath = path.join(this.baseDir, file);
            const exists = fs.existsSync(filePath);
            fileResults[file] = exists;
            
            if (exists) {
                this.logSuccess(`✅ ${file} 存在`);
            } else {
                this.logError(`❌ ${file} 不在`);
            }
        }

        return fileResults;
    }

    // モジュール構文チェック
    checkModuleSyntax() {
        this.logInfo('=== モジュール構文チェック ===');
        
        const jsFiles = [
            'game.js',
            'js/systems/phase5-integration-controller.js',
            'js/systems/integrated-audio-manager.js'
        ];

        for (const file of jsFiles) {
            const filePath = path.join(this.baseDir, file);
            if (!fs.existsSync(filePath)) {
                this.logError(`${file} が見つかりません`);
                continue;
            }

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // import/export構文チェック
                const hasImports = /^import\s+/.test(content);
                const hasExports = /^export\s+/.test(content);
                
                if (hasImports || hasExports) {
                    this.logSuccess(`✅ ${file} ES6モジュール構文確認`);
                } else {
                    this.logWarning(`⚠️ ${file} ES6モジュール構文なし`);
                }

                // 構文エラー簡易チェック
                const syntaxIssues = [];
                if (content.includes('undefined')) {
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        if (line.includes('undefined') && !line.includes('!== undefined') && !line.includes('=== undefined')) {
                            syntaxIssues.push(`Line ${index + 1}: ${line.trim()}`);
                        }
                    });
                }

                if (syntaxIssues.length > 0) {
                    this.logWarning(`${file} 潜在的な問題: ${syntaxIssues.length}件`);
                }

            } catch (error) {
                this.logError(`${file} 読み込みエラー: ${error.message}`);
            }
        }
    }

    // 依存関係チェック
    checkDependencies() {
        this.logInfo('=== 依存関係チェック ===');
        
        const dependencies = {};
        const jsFiles = [
            'game.js',
            'js/systems/phase5-integration-controller.js',
            'js/systems/phase5-safe-integration-layer.js',
            'js/systems/phase4-audio-facade.js'
        ];

        for (const file of jsFiles) {
            const filePath = path.join(this.baseDir, file);
            if (!fs.existsSync(filePath)) continue;

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const importMatches = content.match(/import\s+.*?\s+from\s+['"`](.*?)['"`]/g);
                
                if (importMatches) {
                    dependencies[file] = importMatches.map(match => {
                        const pathMatch = match.match(/from\s+['"`](.*?)['"`]/);
                        return pathMatch ? pathMatch[1] : null;
                    }).filter(Boolean);
                } else {
                    dependencies[file] = [];
                }

                this.logInfo(`${file} 依存関係: ${dependencies[file].length}件`);
                
                // 依存ファイル存在確認
                for (const dep of dependencies[file]) {
                    let depPath;
                    if (dep.startsWith('./')) {
                        depPath = path.join(path.dirname(filePath), dep);
                    } else {
                        depPath = path.join(this.baseDir, dep);
                    }
                    
                    if (fs.existsSync(depPath)) {
                        this.logSuccess(`  ✅ ${dep}`);
                    } else {
                        this.logError(`  ❌ ${dep} (not found: ${depPath})`);
                    }
                }

            } catch (error) {
                this.logError(`${file} 依存関係チェックエラー: ${error.message}`);
            }
        }

        return dependencies;
    }

    // Phase 5統合確認
    checkPhase5Integration() {
        this.logInfo('=== Phase 5統合確認 ===');
        
        const gameJsPath = path.join(this.baseDir, 'game.js');
        if (!fs.existsSync(gameJsPath)) {
            this.logError('game.js が見つかりません');
            return;
        }

        try {
            const content = fs.readFileSync(gameJsPath, 'utf8');
            
            // Phase 5インポート確認
            const hasPhase5Import = content.includes('Phase5IntegrationController');
            if (hasPhase5Import) {
                this.logSuccess('✅ Phase 5 Integration Controller インポート確認');
            } else {
                this.logError('❌ Phase 5 Integration Controller インポートなし');
            }

            // Phase 5初期化確認
            const hasPhase5Init = content.includes('phase5Integration');
            if (hasPhase5Init) {
                this.logSuccess('✅ phase5Integration プロパティ確認');
            } else {
                this.logWarning('⚠️ phase5Integration プロパティなし');
            }

            // 音響システム統合確認
            const hasAudioInit = content.includes('initializeAudioSystem');
            if (hasAudioInit) {
                this.logSuccess('✅ initializeAudioSystem メソッド確認');
            } else {
                this.logWarning('⚠️ initializeAudioSystem メソッドなし');
            }

        } catch (error) {
            this.logError(`Phase 5統合確認エラー: ${error.message}`);
        }
    }

    // HTML要素依存関係確認
    checkHTMLRequirements() {
        this.logInfo('=== HTML要素要件確認 ===');
        
        const testPagePath = path.join(this.baseDir, 'test-phase-5-fixed-v2.html');
        if (!fs.existsSync(testPagePath)) {
            this.logError('テストページが見つかりません');
            return;
        }

        try {
            const content = fs.readFileSync(testPagePath, 'utf8');
            
            const requiredElements = [
                'game-canvas', 'start-game-btn', 'loading-screen',
                'main-menu', 'game-screen', 'master-volume',
                'bgm-volume', 'sfx-volume'
            ];

            for (const elementId of requiredElements) {
                if (content.includes(`id="${elementId}"`)) {
                    this.logSuccess(`✅ ${elementId} 要素確認`);
                } else {
                    this.logError(`❌ ${elementId} 要素なし`);
                }
            }

            // Tone.js CDN確認
            if (content.includes('tone@latest')) {
                this.logSuccess('✅ Tone.js CDN確認');
            } else {
                this.logError('❌ Tone.js CDN読み込みなし');
            }

        } catch (error) {
            this.logError(`HTML要件確認エラー: ${error.message}`);
        }
    }

    // 完全診断実行
    runFullDiagnostics() {
        console.log('🔬 Phase 5 Integration - 完全診断開始');
        console.log('=====================================');
        
        const fileResults = this.checkFileExistence();
        this.checkModuleSyntax();
        this.checkDependencies();
        this.checkPhase5Integration();
        this.checkHTMLRequirements();
        
        console.log('\n=====================================');
        console.log('📊 診断結果サマリー');
        console.log('=====================================');
        
        const summary = {
            success: this.results.filter(r => r.type === 'success').length,
            warning: this.results.filter(r => r.type === 'warning').length,
            error: this.results.filter(r => r.type === 'error').length,
            info: this.results.filter(r => r.type === 'info').length
        };
        
        console.log(`✅ 成功: ${summary.success}`);
        console.log(`⚠️ 警告: ${summary.warning}`);
        console.log(`❌ エラー: ${summary.error}`);
        console.log(`ℹ️ 情報: ${summary.info}`);
        
        const total = summary.success + summary.warning + summary.error;
        const successRate = total > 0 ? (summary.success / total * 100).toFixed(1) : 0;
        console.log(`\n成功率: ${successRate}%`);
        
        if (summary.error > 0) {
            console.log('\n❌ 主要なエラー:');
            this.results
                .filter(r => r.type === 'error')
                .slice(0, 5)
                .forEach(r => console.log(`  - ${r.message}`));
        }
        
        return {
            summary,
            successRate: parseFloat(successRate),
            results: this.results
        };
    }
}

// 実行
if (require.main === module) {
    const runner = new Phase5DiagnosticRunner();
    const results = runner.runFullDiagnostics();
    
    process.exit(results.summary.error > 0 ? 1 : 0);
}

module.exports = Phase5DiagnosticRunner;