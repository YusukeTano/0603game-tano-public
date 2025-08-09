# 0603Game AWS構成ドキュメント

## 📋 プロジェクト概要

**プロジェクト名**: 0603game  
**オーナー**: tano  
**プライマリリージョン**: ap-northeast-1 (東京)  
**アーキテクチャ**: AWS Control Tower + Account Factory for Terraform (AFT)  

このプロジェクトは、AWS Control Towerを基盤としたマルチアカウント環境を構築し、Terraformによるインフラストラクチャのコード化を実現しています。

## 🏗️ AWS アーキテクチャ構成

### マルチアカウント戦略

#### Control Tower 構成
- **Management Account**: Control Tower管理アカウント
- **AFT Management Account**: AFT基盤をデプロイするアカウント
- **Log Archive Account**: ログ集約用アカウント
- **Audit Account**: 監査用アカウント
- **Production Account**: 本番環境用アカウント（prd）

### Account Factory for Terraform (AFT)

AFTは、AWS Control Tower環境でのアカウントプロビジョニングを自動化するソリューションです。

**使用モジュール**:
```hcl
module "aft" {
  source  = "aws-ia/control_tower_account_factory/aws"
  version = "~> 1.14"
}
```

**主要コンポーネント**:
- CodeCommitリポジトリ（4つ）
  - aft-global-customizations
  - aft-account-customizations
  - aft-account-request
  - aft-account-provisioning-customizations
- DynamoDBテーブル（状態管理）
- KMSキー（暗号化）
- S3バケット（Terraformステート保管）

## 📦 Terraform バックエンド構成

### S3バケット構成

| 環境 | バケット名 | 用途 | 暗号化 | バージョニング |
|------|------------|------|--------|----------------|
| AFT | tano-tfstate-aft-setup | AFT基盤のTerraformステート | AES256 | 有効 |
| Accounts | tano-tfstate-accounts | アカウント管理のTerraformステート | AES256 | 有効 |
| Production | tano-tfstate-prd | 本番環境のTerraformステート | AES256 | 有効 |

### DynamoDBテーブル構成

| 環境 | テーブル名 | 用途 | 料金モデル |
|------|------------|------|------------|
| AFT | tano-tflock-aft | AFTのTerraformステートロック | PAY_PER_REQUEST |
| Accounts | tano-tflock-accounts | アカウント管理のステートロック | PAY_PER_REQUEST |
| Production | tano-tflock-prd | 本番環境のステートロック | PAY_PER_REQUEST |

### セキュリティ設定
- ✅ S3バケット: AES256による暗号化
- ✅ S3バケット: バージョニング有効
- ✅ DynamoDB: ステートロック機能
- ✅ すべてのリソースに一貫したタグ付け

## 🚀 CI/CD パイプライン

### GitHub Actions ワークフロー

**ワークフロー名**: Deploy Static Site to S3 via OIDC

#### 主要機能
- **トリガー**: mainブランチへのプッシュ
- **認証方式**: AWS OIDC（OpenID Connect）
- **デプロイ先**: S3バケット（tano-0603game-bucket）
- **リージョン**: ap-northeast-1

#### セキュリティ設定
- IAMロール: `arn:aws:iam::252170044718:role/GitHubActionsRole-0603game-S3Sync`
- OIDC認証によるシークレットレスなデプロイ
- 最小権限の原則に基づいたロール設計

#### デプロイプロセス
```bash
aws s3 sync ./public/ s3://tano-0603game-bucket/ --delete
```
- `public/`ディレクトリの内容をS3バケットに同期
- `--delete`オプションで不要ファイルを削除

## 🛠️ 開発ツール統合

### MCP (Model Context Protocol) サーバー

#### 1. AWS Documentation MCP Server
- **タイプ**: stdio
- **コマンド**: `uvx --python 3.12 awslabs.aws-documentation-mcp-server@latest`
- **用途**: AWSドキュメントへのアクセス
- **環境設定**: 
  - SSL証明書設定（企業プロキシ対応）
  - パーティション: aws

#### 2. AWS Knowledge MCP Server
- **タイプ**: HTTP
- **URL**: https://knowledge-mcp.global.api.aws
- **用途**: AWS知識ベースへのアクセス

#### 3. AWS Terraform MCP
- **タイプ**: stdio
- **コマンド**: `uvx awslabs.terraform-mcp-server@latest`
- **用途**: Terraform/AWSインフラストラクチャ管理

### SSL/TLS設定
企業プロキシ環境での動作のため、カスタムCA証明書を設定:
- 証明書パス: `/Users/tano/.prismaaccess/cert_IRET-SSL-TrsutCA.crt`
- 環境変数: `SSL_CERT_FILE`, `NODE_EXTRA_CA_CERTS`, `REQUESTS_CA_BUNDLE`

## 📂 ディレクトリ構造

```
0603game/
├── .github/
│   └── workflows/
│       └── deploy-to-s3.yml         # GitHub Actionsワークフロー
├── infra/
│   ├── aft-setup/                   # AFT設定
│   │   ├── main.tf                  # AFTモジュール定義
│   │   ├── provider.tf              # プロバイダー設定
│   │   ├── backend.tf               # バックエンド設定
│   │   ├── variables.tf             # 変数定義
│   │   ├── versions.tf              # バージョン制約
│   │   ├── aft-terraform-error-report.md  # エラーレポート
│   │   └── aft-error-investigation-report.md  # 調査レポート
│   └── backend-setup/                # Terraformバックエンド設定
│       ├── main.tf                  # S3/DynamoDB設定
│       ├── provider.tf              # プロバイダー設定
│       ├── terraform.tfstate        # ステートファイル
│       └── terraform.tfstate.backup # バックアップ
├── public/
│   └── maintenance.html             # メンテナンスページ
├── .mcp.json                        # MCP設定ファイル
├── CLAUDE.md                        # Claude AI設定ドキュメント
└── AWS_Configuration_Documentation.md  # このドキュメント
```

## 🔧 インフラストラクチャ管理

### Terraform設定

#### バージョン要件
- Terraform: 最新安定版推奨
- AWS Provider: 最新版使用

#### プロバイダー設定
- リージョン: ap-northeast-1（東京）
- 認証: AWS CLI/環境変数/IAMロール

### リソースタグ戦略

すべてのAWSリソースに以下のタグを適用:
```hcl
tags = {
  Owner       = "tano"
  Project     = "0603game"
  environment = "<環境名>"
}
```

## 🚨 既知の問題と対策

### AFTセットアップのエラー

#### 1. CodeCommitリポジトリ作成エラー
**問題**: CodeCommitでリポジトリが作成できない  
**原因**: CodeCommitサービスが有効化されていない、または権限不足  
**対策**: 
- CodeCommitサービスの有効化確認
- AWS Organizations設定の確認
- SCPポリシーの確認

#### 2. DynamoDBテーブル作成エラー
**問題**: レプリカ更新エラー  
**原因**: 既存リソースとの競合  
**対策**: 
- 既存リソースの確認とインポート
- terraform importコマンドの使用

#### 3. KMSエイリアス競合
**問題**: エイリアスが既に存在  
**原因**: 前回実行の部分的成功  
**対策**: 
- 既存エイリアスの削除またはインポート

## 📈 モニタリングとロギング

### CloudTrail
- すべてのAPI呼び出しを記録
- Log Archiveアカウントに集約

### 推奨される追加設定
- CloudWatch Logs統合
- AWS Config有効化
- AWS Security Hub統合
- GuardDuty有効化

## 🔐 セキュリティベストプラクティス

### 実装済み
- ✅ OIDC認証によるシークレットレスデプロイ
- ✅ S3バケットの暗号化とバージョニング
- ✅ DynamoDBステートロック
- ✅ マルチアカウント分離
- ✅ Control Tower ガードレール

### 推奨事項
- [ ] MFA強制の実装
- [ ] セッションマネージャーの活用
- [ ] 定期的な権限レビュー
- [ ] バックアップ戦略の策定
- [ ] ディザスタリカバリー計画

## 📝 運用手順

### AFT環境のセットアップ
```bash
cd infra/aft-setup
terraform init
terraform plan
terraform apply
```

### バックエンドのセットアップ
```bash
cd infra/backend-setup
terraform init
terraform plan
terraform apply
```

### GitHub Actions経由のデプロイ
1. コードをmainブランチにプッシュ
2. GitHub Actionsが自動的にトリガー
3. OIDCによる認証
4. S3へのデプロイ実行

## 📚 参考リンク

- [AWS Control Tower Documentation](https://docs.aws.amazon.com/controltower/)
- [Account Factory for Terraform](https://github.com/aws-ia/terraform-aws-control_tower_account_factory)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [GitHub Actions OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

## 🔄 更新履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2025-01-09 | 1.0.0 | 初版作成 |

---

*このドキュメントは、0603gameプロジェクトのAWS構成を包括的に記録したものです。*
*定期的な更新と見直しを推奨します。*