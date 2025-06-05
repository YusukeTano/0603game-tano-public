# **📚 完全版ドキュメント v1.1**

**ファイル構成**：本ドキュメント 1 つで「コンセプト定義 → 要件定義 → 基本設計 → 詳細設計 → マスター仕様 → テスト仕様」を網羅。

**更新履歴**

| Ver | 日付 | 概要 |
| ----- | ----- | ----- |
| 1.0 | 2025‑06‑03 | 初版作成 |
| 1.1 | 2025‑06‑03 | 各章を詳細化、アセット一覧・テストケース拡充 |

---

## **1\. コンセプト定義**

| 項目 | 内容 |
| ----- | ----- |
| **ターゲット層** | **PC ブラウザユーザ** — Steam / itch.io など HTML5 タイトルを嗜むカジュアルゲーマー（18〜40 代） |
| **プラットフォーム** | **静的 Web サイト**：S3 \+ CloudFront（推奨）または EC2 \+ Nginx / Apache。全ロジックは WebGL (Phaser 3\) 上で動作。 |
| **ジャンル** | **Bullet‑Heaven（サバイバーライク）**／1 プレイ 30 分耐久＋ラスボス戦。 |
| **世界観・テーマ** | **近未来 SF × ポップ宇宙**。ネオン＆パステルカラー、ゆるいロボ＆エイリアン。 |
| **コアゲームプレイ** | 大量の敵を捌きつつ武器を育成 → 進化。一切のオンライン要素なし。 |
| **差別化ポイント** | *武器 Evolution*：特定パッシブ \+ Lv8 で外観も挙動も劇的変化。 |
| **アートスタイル** | 2D スプライト（64–128 px）。パーティクルでリッチに。 |
| **サウンド** | リズミカルなチップチューン × EDM。BPM 130±10。 |
| **収益モデル** | 完全無料・広告なし・OSS。学習 & ポートフォリオ用途。 |
| **開発体制** | 個人開発（あなた \+ Claude Code）／OSS ライブラリ活用。6 週間スプリント。 |
| **技術スタック** | TypeScript \+ Phaser 3 \+ Vite / ESLint / Jest / Playwright / AWS CLI / GitHub Actions。 |

---

## **2\. 要件定義書**

### **2.1 目的・ゴール**

1. **学習**：モダン WebGL（Phaser 3）＋ ECS 設計パターンを実践。

2. **ポートフォリオ**：ブラウザ 1 クリックで遊べる完成品を公開。GitHub OSS ライセンス MIT で配布。

3. **性能指標**：低スペック (Intel UHD 620\) でも 60 FPS。初回ロード 3 s 未満。

### **2.2 ステークホルダー**

| 役割 | 利害 | インプット / アウトプット |
| ----- | ----- | ----- |
| 開発者 (あなた) | 学習・実績 | コード、アセット、ドキュメント |
| プレイヤー | 遊びやすさ・リプレイ性 | フィードバック／バグ報告 |
| OSS コミュニティ | 再利用性 | Issue / PR |

### **2.3 機能要件（詳細）**

#### **2.3.1 ゲーム本編**

| ID | 名称 | 詳細仕様 | 優先度 |
| ----- | ----- | ----- | ----- |
| G‑1 | ステージ進行 | 30 分制限タイマー；10/20 分に中ボス；30 分到達でラスボス召喚。ラスボス撃破 or プレイヤー死亡で終了。 | ★★★ |
| G‑2 | プレイヤー操作 | *左クリック長押し*：仮想スティック移動。*右クリック*：必殺発動（ゲージ≥100%）。攻撃は自動射出ロジック。 | ★★★ |
| G‑3 | 武器システム | 武器 6 種、Lv1‑8。`evolution.trigger(passiveId, level8)` で Evolution 6 種。 | ★★★ |
| G‑4 | パッシブシステム | パッシブ 6 種、Lv1‑6。ステータス補正と進化条件に使用。 | ★★☆ |
| G‑5 | 敵 & ウェーブ | `WavePlanner` が 60 s 周期で JSON 定義を読み込みスポーンキュー生成。 | ★★★ |
| G‑6 | 必殺ゲージ | `GaugeSystem`：EnemyKilled → `+1`, Elite `+5`. 100 到達で `SpecialReady` イベント。 | ★★★ |
| G‑7 | セーブ | `localStorage['save_v1']` に JSON。30 s ごと & 終了時自動保存。 | ★★☆ |
| G‑8 | UI / HUD | タイム／HP／必殺ゲージ／ゴールド／FPS を Pixi GUI で常時描画。 | ★★★ |

#### **2.3.2 メタ機能**

| ID | 名称 | 仕様 | 優先度 |  
 | M‑1 | オプション | 音量 (Master/BGM/SFX)、画質 (Low/High)、色覚モード (Normal/High‑Contrast)、キーコンフィグ (WASD or カーソル)。 | ★★☆ |  
 | M‑2 | アナリティクス | GA4：`event_levelUp`, `event_death`, `event_bossKill`。UID は hash(local time)。 | ☆☆☆ |  
 | M‑3 | 配信パイプライン | GitHub Actions：build → Jest → Playwright → `aws s3 sync` stg → 自動 invalidation → manual prod promote。 | ★★☆ |

### **2.4 非機能要件**

| カテゴリ | 指標 | 値 |
| ----- | ----- | ----- |
| パフォーマンス | FPS | ≥ 60 FPS (平均) |
|  | GC Stall | ≤ 5 ms/frame |
| 信頼性 | クラッシュ率 | 0.1 % 未満 (Playwright 50 連続走行) |
| 保守性 | Lint エラー | 0 |
| セキュリティ | CSP | `default-src 'self'; script-src 'self';` 他 |

---

## **3\. 基本設計書**

### **3.1 画面遷移 & ワイヤーフレーム**

\[Title\]  
  ├─▶ \[StageSelect\]  
  │       └▶ \[Gameplay\]  
  │             └▶ \[Result\]  
  └─▶ \[Options\]

#### **3.1.1 UI 配置（1080p 基準）**

| UI | X | Y | Size | 備考 |
| ----- | ----- | ----- | ----- | ----- |
| 残り時間 | 30 | 30 | 200×48 | Shadow 2 px \#0008 |
| HPバー | 30 | 90 | 300×18 | Gradient \#2ECC71→\#E74C3C |
| 必殺ゲージ | 540 | 30 | 400×22 | `progress‑bar.tsx` コンポーネント |
| ゴールド | 1660 | 30 | 200×48 | Coin icon \+ 数字 |
| FPS | 1760 | 1030 | 120×24 | dev build only |

### **3.2 アーキテクチャレイヤ**

┌── core ──┐   ┌── gameplay ───┐   ┌── ui ─┐  
│ ECSLoop  │   │ Systems    │   │ React 🚫 │  
│ Math util│   │   Weapon   │   │ PixiGUI  │  
└──────────┘   │   EnemyAI  │   └──────────┘  
               │   Gauge    │  
               └────────────┘

* **bitecs** ECS。`System<T>` の更新順: Input → Spawn → AI → Move → Collision → Damage → Gauge → Render。

* **ui** は PixiJS の Container で独立。DOM UI は使わず WebGL 1 枚。

### **3.3 モジュール依存図**

`core` ← `gameplay` ← `ui`  
 `content` は純 JSON でどこからでも参照。

### **3.4 マイルストーン詳細**

| 週 | 目標 | Deliverables |
| ----- | ----- | ----- |
| W1 | Skeleton | InputSystem, RenderSystem, Player entity が動くデモ |
| W2 | Combat Alpha | EnemySpawn \+ EnemyAI \+ Collision；撃破可 |
| W3 | Growth Beta | LevelUp UI、武器 2 種実装、パッシブ 2 種実装 |
| W4 | Special & HUD | 必殺ゲージ、HUD 完成、効果音仮入れ |
| W5 | Content Lock | 武器 6 / 敵 8 / ボス 3 実装、30 min 通しプレイ |
| W6 | Polish & Release | アート差し替え、BGM 5 曲、バランス調整、公開 |

---

## **4\. 詳細設計書**

### **4.1 ECS コンポーネント定義 (TypeScript)**

export interface Position { x: f32; y: f32 }  
export interface Velocity { vx: f32; vy: f32 }  
export interface Health { hp: i32; max: i32 }  
export interface Damage { base: i32; critChance: f32 }  
export interface WeaponData {  
  type: WeaponId;  
  level: u8;  
  cooldown: f32;  
  timer: f32;  
}  
export interface Gauge { value: f32 } // 0–100

### **4.2 System アルゴリズム (擬似コード)**

function WeaponSystem(dt) {  
  for entity with WeaponData & Position {  
    data.timer \+= dt;  
    if (data.timer \>= data.cooldown) {  
       spawnProjectile(entity.position, data);  
       data.timer \= 0;  
    }  
  }  
}

function GaugeSystem(event: EnemyKilled) {  
  const player \= event.killer;  
  Gauge.value\[player\] \= Math.min(100, Gauge.value\[player\] \+ event.value);  
}

### **4.3 JSON スキーマ**

// enemies.schema.json (抜粋)  
{  
  "$id": "\#/enemy",  
  "type": "object",  
  "properties": {  
    "id": { "type": "string" },  
    "name": { "type": "string" },  
    "hp": { "type": "integer" },  
    "speed": { "type": "number" },  
    "touchDmg": { "type": "integer" },  
    "spawnWeight": { "type": "number" },  
    "appearMinute": { "type": "integer" }  
  },  
  "required": \["id", "hp", "speed"\]  
}

### **4.4 パラメータテーブル（完全）**

**武器 6 種 × Lv1–8 × Evolution**／**パッシブ 6 種**／**敵 8 \+ エリート 2 \+ ボス 3**  
 CSV → JSON 変換スクリプト `/scripts/xlsx2json.ts` で管理。

---

## **5\. 仕様書（マスター仕様）**

### **5.1 アセット一覧**

| カテゴリ | ID | ファイル | フレーム | Hitbox | 備考 |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Player | player\_ship | `player/player_ship@1x.png` | 8 | r20 | 2x 版あり |
| Weapon | laser\_beam | `weapon/laser_beam@1x.png` | 4 | n/a | scroll UV |
| 〃 | shuriken | `weapon/shuriken@1x.png` | 8 | n/a | rotation |
| Enemy | drone | `enemy/drone@1x.png` | 4 | r16 | — |
| ... | ... | ... | ... | ... | ... |

**総テクスチャ枚数**：124（1x）／124（2x）。Atlas 4 枚 (2048²)。

### **5.2 VFX & シェーダ**

| イベント | エフェクト | 実装 |
| ----- | ----- | ----- |
| LvUp | 星屑パーティクル (200 ms) \+ 暗転 (opacity 0.6) | particle.ts → Tween |
| 必殺 | Flash (white) 200 ms → Shake amplitude 6px 400 ms | screenFx.ts |
| Boss Spawn | 波紋ディストーション GLSL (radial) 800 ms | postfx.ts |

### **5.3 パフォーマンス予算**

* **Draw Calls** ≤ 150／frame (SpriteBatch)

* **VRAM** ≤ 250 MB @1080p

* **CPU Main Thread** ≤ 13 ms/frame (≈ 75 FPS headroom)

---

## **6\. テスト仕様書**

### **6.1 テストレベル & メトリクス**

| レベル | カバー率目標 |
| ----- | ----- |
| 単体 (Jest) | 80 %+ Branch coverage |
| 結合 (Playwright) | 95 % 主経路 |
| システム (Manual+Headless) | 100 % クリティカル機能 |
| 負荷 (Puppeteer) | 60 FPS 保障 |

### **6.2 テストケースサンプル**

| TCID | レベル | シナリオ | 期待結果 |
| ----- | ----- | ----- | ----- |
| UT‑WEAP‑CD | UT | WeaponSystem: timer=cd‑0.01→update(dt=0.02) | projectile spawn / timer=0 |
| INT‑GAUGE‑FILL | INT | Kill 100 drones | Gauge.value==100 / SpecialReady event |
| SYS‑BOSS‑PHASE | SYS | ラスボス HP 66%→33% | Phase 2/3 開始演出発火 |
| PERF‑2000 | LOAD | spawnEnemies(2000) 10 s | meanFPS ≥60 |
| SEC‑CSP | SEC | eval("alert(1)") | ブロック (CSP violation) |

### **6.3 受入基準**

1. 重大バグ (severity=blocker) 0 件。

2. 高優先バグ 0 件、Medium 以下は回避策記載でリリース可。

3. 全ケース通過率 ≥ 95 %。

4. PERF‑2000 テストで 60 FPS を下回らない。