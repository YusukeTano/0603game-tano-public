# 🎮 0603game - Star Surge

静的Webホスティングで動作する高品質シューティングゲームと、エンタープライズグレードのAWSインフラストラクチャの実装例

[![Terraform](https://img.shields.io/badge/terraform-1.9.2-7B42BC)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-Multi_Account-FF9900)](https://aws.amazon.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF)](https://github.com/features/actions)

## 🌟 Project Vision

このプロジェクトは **技術的卓越性** と **エンターテインメント** の融合を目指しています：

- **🎯 技術的学習価値**: AWS Well-Architectedフレームワークに準拠した実践的なTerraform実装
- **🔒 エンタープライズセキュリティ**: OIDC認証、マルチアカウント戦略によるゼロトラスト実装
- **🎮 楽しいユーザー体験**: ブラウザで遊べる本格的なHTML5シューティングゲーム
- **💡 教育的価値**: DevOps/IaCのベストプラクティス実装例として活用可能

## 🏗️ Architecture Overview

```
User → CloudFront → S3 (OAC) → Static Game
         ↓
     Route53 (DNS)
         ↓
    Multi-Account Strategy
    ├── dev (330723288310) - 開発環境
    ├── stg (434023888095) - ステージング環境  
    ├── prd (002540791269) - 本番環境
    └── DNS (252170044718) - DNS管理専用
```

### アーキテクチャの特徴

- **マルチアカウント戦略**: 環境間の完全分離でblast radiusを最小化
- **OAC (Origin Access Control)**: S3への直接アクセスを防止
- **HTTPS/HTTP2**: CloudFrontによる高速・安全な配信
- **Infrastructure as Code**: Terraformによる宣言的インフラ管理

## 🔧 Technology Stack & Rationale

### Frontend
- **HTML5 Canvas**: 高フレームレートゲームに最適
- **Vanilla JavaScript**: フレームワーク不要の軽量実装
- **CSS3**: レスポンシブ対応のモダンUI

### Infrastructure
- **Terraform 1.9.2**: マルチクラウド対応と豊富なエコシステム
- **AWS Provider**: 成熟したクラウドサービス統合
- **CloudFront + S3**: グローバル配信とコスト効率

### CI/CD
- **GitHub Actions**: OIDC統合によるシークレットレス認証
- **OIDC Authentication**: 一時的な認証トークン（15分有効）で長期シークレット不要

## 🚀 Quick Start

### Prerequisites
```bash
# 必要なツール
- AWS CLI configured
- Terraform 1.9.2
- direnv (optional but recommended)
```

### Deploy to Dev Environment
```bash
# 1. リポジトリクローン
git clone <repository-url>
cd 0603game

# 2. AWS認証設定
export AWS_PROFILE=0603game-TerraformOperator

# 3. 開発環境にデプロイ
cd infra/static-website/environments/dev
terraform init
terraform plan
terraform apply
```

### Play the Game
- **開発環境**: https://dev.tanoyuusuke.com
- **本番環境**: https://tanoyuusuke.com

#### ゲーム操作方法
- **PC**: WASD / 矢印で移動、スペースで射撃、Pで一時停止
- **モバイル**: 画面ドラッグで移動、長押しで射撃

## 👨‍💻 Development Workflow

### Feature Development
1. **ブランチ作成**: `git checkout -b feature/your-feature`
2. **コード変更**: インフラまたはゲームコードを修正
3. **プッシュ**: `git push origin feature/your-feature`
4. **自動処理**: Lint & Draft PR自動作成
5. **レビュー**: Terraform planの結果を PR で確認
6. **マージ**: `main`ブランチにマージ → 開発環境自動デプロイ

### Production Release
1. **開発環境テスト**: 変更内容を開発環境で検証
2. **バージョンタグ**: `git tag v1.0.0 && git push origin v1.0.0`
3. **本番デプロイ**: GitHub Actionsが自動実行

## 🔄 CI/CD Pipeline

| Workflow | Trigger | Action | Status |
|----------|---------|--------|---------|
| `terraform-ci-feature-lint-draftpr.yml` | feature/* push | Lint, validate, create draft PR | ✅ Active |
| `terraform-plan-dev.yml` | PR ready | Run plan, post results | 🚧 WIP |
| `terraform-apply-dev.yml` | main merge | Deploy to dev | 🚧 WIP |
| `terraform-deploy-prd.yml` | v*.*.* tag | Deploy to production | ✅ Active |
| `deploy-to-s3.yml` | main merge | Sync game files | ✅ Active |

## 🔮 Development Roadmap

### ✅ Phase 1（完了済み）
- [x] 静的サイト（Star Surgeゲーム）の実装
- [x] マルチ環境インフラストラクチャ（dev/stg/prd）
- [x] CloudFront + S3 による高速配信
- [x] GitHub Actions OIDC認証
- [x] Route53 による DNS管理
- [x] Terraformモジュール化

### 🚧 Phase 2（現在進行中）
- [ ] **CI/CDパイプラインの強化**
  - [x] Feature Branch Lint & Auto Draft PR機能
  - [ ] terraform-plan-dev.yml の実装完了
  - [ ] terraform-apply-dev.yml の自動化完了
  - [ ] PR連動のplan結果コメント機能
- [ ] **インフラコードの品質向上**
  - [ ] TFLintルールの最適化
  - [ ] terraform validate の全環境対応
  - [ ] キャッシュによるCI/CD高速化

### 📅 Phase 3（計画中）
- [ ] **運用効率化**
  - [ ] コスト最適化（CloudWatch メトリクス）
  - [ ] terraform.tfvars のより柔軟な管理
  - [ ] ステージング環境の自動テスト
- [ ] **ドキュメント整備**
  - [ ] Terraform モジュールの詳細ドキュメント
  - [ ] トラブルシューティングガイドの拡充
  - [ ] アーキテクチャ図の追加

### 💭 将来的な検討事項
- Container化によるローカル開発環境の統一
- Terraform Cloudの導入検討
- セキュリティスキャン（Checkov/tfsec）の統合

## 🔐 Security Architecture

### Zero-Trust Implementation
- **認証**: GitHub OIDC (シークレット不要)
- **認可**: IAM AssumeRole with 最小権限原則
- **暗号化**: S3 SSE-S3, CloudFront HTTPS Only
- **監査**: CloudTrail logging 全環境対応

### Account Isolation Strategy
```
環境ごとに完全に分離されたAWSアカウント
├── 開発環境：リソース制限あり、コスト最適化
├── ステージング環境：本番同等構成、テスト用途
├── 本番環境：最高レベルのセキュリティ設定
└── DNS管理：Route53専用、クロスアカウント権限
```

### コンプライアンス対応
- **データ暗号化**: 保存時・転送時の両方で対応
- **アクセス管理**: 一時的な認証トークンのみ使用
- **監査ログ**: CloudTrailによる全操作記録
- **インフラ可視化**: Terraform stateによる構成管理

## 💰 Cost Analysis

| Service | Dev | Stg | Prd | Notes |
|---------|-----|-----|-----|-------|
| CloudFront | $1 | $2 | $3 | 転送量に比例 |
| S3 | $0.1 | $0.1 | $0.2 | 10MB storage |
| Route53 | $0.5 | - | - | DNS専用アカウント |
| **月額合計** | **~$2** | **~$2** | **~$4** | 最小構成想定 |

### コスト最適化のポイント
- **CloudFront**: キャッシュ効率化で転送料削減
- **S3**: ライフサイクルポリシーで古いファイル削除
- **Route53**: DNSクエリ最適化

## 📁 Project Structure

```
0603game/
├── public/                    # 静的サイト（ゲーム）
│   ├── index.html            # メイン HTML
│   ├── game.js              # ゲームロジック
│   └── styles.css           # スタイル
├── infra/                   # Infrastructure as Code
│   ├── backend-setup/       # Terraform state管理
│   │   ├── environments/    # 環境別設定
│   │   └── modules/        # 共通モジュール
│   ├── static-website/      # Webサイトインフラ
│   │   └── environments/    # dev/stg/prd設定
│   └── mod/modules/         # 再利用可能モジュール
│       ├── acm-certificate/ # SSL証明書自動発行
│       ├── cloudfront-oac/  # CloudFront + OAC
│       ├── route53-records/ # DNS管理
│       └── s3-private-bucket/ # プライベートS3
├── .github/workflows/       # CI/CD パイプライン
└── CLAUDE.md               # 開発ガイドライン
```

## 🔧 Troubleshooting

### よくある問題と解決方法

| 問題 | 症状 | 原因 | 解決方法 |
|------|------|------|-----------|
| **Terraform init失敗** | `Error: Backend initialization required` | AWS認証エラー | `aws sts get-caller-identity` で認証確認 |
| **Plan実行失敗** | `Error: Resource lock` | State lock | DynamoDBテーブルの lock確認・削除 |
| **GitHub Actions失敗** | `Error: AssumeRole failed` | OIDC設定エラー | IAM Role Trust Relationship確認 |
| **ゲームが表示されない** | 白い画面 | S3同期エラー | `aws s3 sync ./public/ s3://bucket-name/` |

### Debug Commands

```bash
# AWS認証確認
aws sts get-caller-identity

# Terraform詳細ログ
export TF_LOG=DEBUG
terraform plan

# S3同期確認  
aws s3 ls s3://tano-0603game-bucket/ --recursive

# CloudFront invalidation
aws cloudfront create-invalidation --distribution-id EDFD... --paths "/*"
```

### 緊急時の対処

#### 1. 本番環境でエラーが発生した場合
```bash
# 前のバージョンにロールバック
git tag v1.0.1
git push origin v1.0.1  # 自動デプロイが実行される
```

#### 2. インフラが応答しない場合
```bash
# 開発環境で検証
cd infra/static-website/environments/dev
terraform plan  # 差分確認
terraform apply  # 修復実行
```

## 🛠️ Development Commands

### Terraform操作
```bash
# フォーマット（プロジェクト全体）
terraform fmt -recursive

# 初期化
terraform init

# 検証
terraform validate

# プラン確認
terraform plan

# 適用
terraform apply

# リソース削除（注意！）
terraform destroy
```

### ローカル開発
```bash
# ゲームをローカルで確認
cd public/
python -m http.server 8000
# http://localhost:8000 でアクセス

# AWS S3への手動同期
aws s3 sync ./public/ s3://tano-0603game-bucket/ --delete
```

## 🤝 Contributing

### 貢献方法
1. **リポジトリをフォーク**
2. **Feature ブランチ作成**: `git checkout -b feature/amazing-feature`
3. **コード品質チェック**:
   ```bash
   terraform fmt -recursive
   terraform validate
   ```
4. **変更をコミット**: `git commit -m 'feat: add amazing feature'`
5. **プッシュ**: `git push origin feature/amazing-feature`
6. **Pull Request作成**

### コード規約
- **Terraform**: HashiCorpの標準スタイル
- **JavaScript**: ES6+ syntax
- **コミット**: Conventional Commits規約

### PR チェックリスト
- [ ] `terraform fmt` 実行済み
- [ ] `terraform validate` 成功
- [ ] `terraform plan` で意図した変更であることを確認
- [ ] 必要なドキュメント更新済み
- [ ] セキュリティ影響を評価済み

## 📚 Learning Resources

このプロジェクトで学べる内容：

### Level 1: 基礎
- Terraformの基本構文とstate管理
- AWSの基本サービス（S3, CloudFront, Route53）
- Git/GitHubを使った開発フロー

### Level 2: 中級
- Terraformモジュール設計とDRY原則
- CI/CDパイプライン構築
- マルチ環境管理とベストプラクティス

### Level 3: 上級
- エンタープライズセキュリティ実装
- コスト最適化戦略
- 大規模インフラストラクチャの運用

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Acknowledgments

- [Terraform](https://www.terraform.io/) - Infrastructure as Code
- [AWS](https://aws.amazon.com/) - Cloud Infrastructure
- [GitHub Actions](https://github.com/features/actions) - CI/CD Platform

---

**🎮 Ready to play?** Visit [tanoyuusuke.com](https://tanoyuusuke.com) and enjoy Star Surge!

**🚀 Ready to deploy?** Follow the Quick Start guide and build your own cloud infrastructure!