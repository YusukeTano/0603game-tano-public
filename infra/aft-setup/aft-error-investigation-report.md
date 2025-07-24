# AWS Account Factory for Terraform (AFT) エラー詳細調査レポート

## 調査概要

AWS CLIを使用してAFTセットアップエラーの詳細調査を実施しました。

### 調査環境
- 実行アカウント: Control Tower管理アカウント (252170044718)
- 実行ロール: AWSReservedSSO_AdministratorAccess
- リージョン: ap-northeast-1

## 主要な調査結果

### 1. アカウント構成の問題

**根本原因**: AFTモジュールが複数のアカウントにまたがってリソースを作成しようとしているが、現在のプロバイダー設定は単一アカウント（Control Tower管理アカウント）のみを対象としている。

**詳細**:
- `provider.tf`の両プロバイダー（デフォルトと`mgmt`エイリアス）が同じアカウントを指している
- AFTは通常、AFT管理アカウント（318574063927）でリソースを作成する必要がある
- DynamoDBテーブル`aft-backend-318574063927`とKMSエイリアスはAFT管理アカウントに作成されるべき

### 2. CodeCommitの組織レベル制限

**エラー詳細**:
```
OperationNotAllowedException: CreateRepository request is not allowed because 
there is no existing repository in this AWS account or AWS Organization
```

**調査結果**:
- CodeCommitサービスが組織レベルで制限されている
- テストリポジトリの作成も同じエラーで失敗
- この制限は新規AWSアカウントまたは組織に対するAWSのセキュリティ措置の可能性

### 3. Terraform State不整合

**発見事項**:
- Terraform stateファイルには既にリソースが登録されている:
  - `aft-backend-318574063927` (DynamoDBテーブル)
  - `alias/aft-backend-318574063927-kms-key` (KMSエイリアス)
- しかし、これらのリソースは実際には存在しないか、異なるアカウントに存在する

## 推奨される解決策

### 解決策1: マルチアカウントプロバイダー設定（推奨）

AFT管理アカウント用のプロバイダーを追加:

```hcl
# provider.tf を修正

# Control Tower管理アカウント用
provider "aws" {
  region  = "ap-northeast-1"
  profile = "AdministratorAccess-252170044718-0603game-sso"
}

# AFT管理アカウント用（要: プロファイル作成）
provider "aws" {
  alias   = "aft"
  region  = "ap-northeast-1"
  profile = "AdministratorAccess-318574063927-aft-sso"  # 新規作成必要
}

# Control Tower管理アカウント用（mgmtエイリアス）
provider "aws" {
  alias   = "mgmt"
  region  = "ap-northeast-1"
  profile = "AdministratorAccess-252170044718-0603game-sso"
}
```

### 解決策2: CodeCommit代替案の使用

```hcl
# main.tf を修正

module "aft" {
  source  = "aws-ia/control_tower_account_factory/aws"
  version = "~> 1.14"

  # CodeCommitの代わりにGitHubを使用
  vcs_provider = "github"
  github_enterprise_url = ""  # GitHub.comの場合は空
  
  # その他の設定は同じ
  ct_management_account_id    = var.ct_management_account_id
  # ...
}
```

### 解決策3: 段階的なクリーンアップと再デプロイ

1. **既存のstateをバックアップ**:
   ```bash
   terraform state pull > terraform.tfstate.backup.json
   ```

2. **問題のあるリソースをstateから削除**:
   ```bash
   terraform state rm module.aft.module.aft_backend.aws_dynamodb_table.lock-table
   terraform state rm module.aft.module.aft_backend.aws_kms_alias.encrypt-alias-secondary-region[0]
   terraform state rm module.aft.module.aft_code_repositories.aws_codecommit_repository.global_customizations[0]
   terraform state rm module.aft.module.aft_code_repositories.aws_codecommit_repository.account_customizations[0]
   terraform state rm module.aft.module.aft_code_repositories.aws_codecommit_repository.account_request[0]
   terraform state rm module.aft.module.aft_code_repositories.aws_codecommit_repository.account_provisioning_customizations[0]
   ```

3. **GitHubを使用するように設定を変更後、再デプロイ**

### 解決策4: CodeCommit制限の解除

1. **AWS Supportに連絡**:
   - CodeCommit制限の解除をリクエスト
   - 組織IDとアカウントIDを提供

2. **一時的な回避策として別リージョンを試す**:
   ```bash
   aws codecommit create-repository --repository-name test-repo --region us-east-1
   ```

## 即座に実行可能なアクション

### 1. AFT管理アカウントへのアクセス設定

```bash
# AWS SSO設定を更新してAFT管理アカウントにアクセス
aws configure sso --profile aft-admin
# アカウントID: 318574063927 を選択
```

### 2. GitHubトークンの準備

AFTでGitHubを使用する場合:
- GitHub Personal Access Tokenを作成
- AWS Secrets Managerに保存

### 3. 設定ファイルの更新

`terraform.tfvars`を作成:
```hcl
# VCS設定（GitHubを使用する場合）
vcs_provider = "github"
github_token_secret_name = "aft-github-token"
```

## 結論

主な問題は以下の3点:

1. **アカウント境界の問題**: AFTリソースが適切なアカウントに作成されていない
2. **CodeCommit制限**: 組織レベルでの制限により新規リポジトリ作成が不可
3. **State不整合**: 過去の部分的な実行によりstateが不整合状態

最も実用的な解決策は、CodeCommitからGitHubへの移行と、適切なマルチアカウントプロバイダー設定の実装です。これにより、AFTを正常にデプロイできるようになります。