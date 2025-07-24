# AWS Account Factory for Terraform (AFT) エラー調査レポート

## 概要

Terraform apply実行時に発生したエラーの詳細調査結果をまとめました。AFTのセットアップ中に5つの主要なエラーと1つの警告が発生しています。

## エラー詳細と解決策

### 1. S3バケットライフサイクル設定の警告

**警告内容:**
```
Warning: Invalid Attribute Combination
No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required
```

**原因:**
- S3バケットライフサイクルルールの設定で、`filter`または`prefix`のいずれか一つが必須ですが、どちらも指定されていません
- これはAFTモジュール内部の問題で、古いバージョンのモジュールが新しいAWSプロバイダーと互換性がない可能性があります

**解決策:**
- AFTモジュールを最新バージョンにアップデートする
- 現在の警告は将来的にエラーになるため、早めの対応が推奨されます

### 2. DynamoDBテーブル作成エラー

**エラー内容:**
```
Error: creating AWS DynamoDB Table (aft-backend-318574063927): 
ValidationException: Cannot add, delete, or update the local region through ReplicaUpdates. 
Use CreateTable, DeleteTable, or UpdateTable as required.
```

**原因:**
- DynamoDBテーブルが既に存在している可能性があります
- レプリカの設定でローカルリージョン（ap-northeast-1）を更新しようとしているが、これは許可されていません
- 既存のリソースとTerraformの状態が不一致になっている可能性があります

**解決策:**
1. 既存のDynamoDBテーブルを確認:
   ```bash
   aws dynamodb describe-table --table-name aft-backend-318574063927 --region ap-northeast-1
   ```
2. 既存テーブルがある場合は、Terraformにインポート:
   ```bash
   terraform import module.aft.module.aft_backend.aws_dynamodb_table.lock-table aft-backend-318574063927
   ```
3. または、既存リソースを削除してから再実行

### 3. KMSエイリアス作成エラー

**エラー内容:**
```
Error: creating KMS Alias (alias/aft-backend-318574063927-kms-key): 
AlreadyExistsException: An alias with the name already exists
```

**原因:**
- KMSエイリアスが既に存在しています
- 前回の実行が部分的に成功した可能性があります

**解決策:**
1. 既存のエイリアスを確認:
   ```bash
   aws kms list-aliases --region ap-northeast-1 | grep aft-backend-318574063927-kms-key
   ```
2. 既存のエイリアスをTerraformにインポート:
   ```bash
   terraform import module.aft.module.aft_backend.aws_kms_alias.encrypt-alias-secondary-region[0] alias/aft-backend-318574063927-kms-key
   ```
3. または、既存のエイリアスを削除してから再実行

### 4. CodeCommitリポジトリ作成エラー（4つ）

**エラー内容:**
```
Error: creating CodeCommit Repository: 
OperationNotAllowedException: CreateRepository request is not allowed because 
there is no existing repository in this AWS account or AWS Organization
```

**影響を受けるリポジトリ:**
- aft-global-customizations
- aft-account-customizations
- aft-account-request
- aft-account-provisioning-customizations

**原因:**
- CodeCommitサービスが有効化されていない可能性があります
- AWS Organizations内でCodeCommitを使用するための設定が不足している可能性があります
- リージョンの制限がかかっている可能性があります
- SCPやアカウントレベルの権限制限がある可能性があります

**解決策:**
1. CodeCommitサービスの有効化を確認:
   ```bash
   aws codecommit list-repositories --region ap-northeast-1
   ```

2. AWS Organizationsの設定を確認:
   - Control Tower管理アカウントでSCPを確認
   - CodeCommitサービスへのアクセスが制限されていないか確認

3. 代替案として、GitHubやGitLabを使用:
   AFTモジュールの設定で`vcs_provider`を変更:
   ```hcl
   module "aft" {
     source = "github.com/aws-ia/terraform-aws-control_tower_account_factory.git?ref=1.14.0"
     
     vcs_provider = "github"
     github_enterprise_url = ""  # GitHub.comを使用する場合は空
     # その他の設定...
   }
   ```

## 推奨される対応手順

### ステップ1: 既存リソースの確認
```bash
# DynamoDBテーブルの確認
aws dynamodb list-tables --region ap-northeast-1 | grep aft-backend

# KMSエイリアスの確認
aws kms list-aliases --region ap-northeast-1 | grep aft-backend

# CodeCommitリポジトリの確認
aws codecommit list-repositories --region ap-northeast-1
```

### ステップ2: Terraformの状態を同期
```bash
# 既存リソースがある場合は、terraform state をリフレッシュ
terraform refresh

# または、完全にクリーンな状態から始める場合
terraform destroy -auto-approve  # 注意: 既存リソースが削除されます
```

### ステップ3: CodeCommitの問題を解決
1. CodeCommitを使用しない場合は、GitHubやGitLabに切り替える
2. CodeCommitを使用する場合は、AWS サポートに問い合わせて制限を確認

### ステップ4: 段階的なデプロイ
```bash
# 特定のリソースのみを対象にする
terraform apply -target=module.aft.module.aft_backend
```

## 追加の推奨事項

1. **AFTモジュールのバージョン確認**
   - 現在使用中: v1.14.0
   - 最新バージョンがある場合はアップデートを検討

2. **AWSアカウントの前提条件確認**
   - Control Towerが正しくセットアップされているか
   - AFT管理アカウントがControl Towerに登録されているか
   - 必要なIAM権限が付与されているか

3. **ログの詳細確認**
   ```bash
   export TF_LOG=DEBUG
   terraform apply -auto-approve > terraform.log 2>&1
   ```

## まとめ

主な問題は以下の2点です：
1. **既存リソースとの競合**: DynamoDBとKMSエイリアスが既に存在
2. **CodeCommitサービスの制限**: 組織レベルまたはアカウントレベルでの制限

これらの問題を解決するためには、既存リソースの確認と適切な対処（インポートまたは削除）、そしてCodeCommitの代替案の検討が必要です。