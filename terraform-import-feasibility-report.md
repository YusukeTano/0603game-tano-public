# Terraform Import実現可能性レポート
## 作成日: 2025-07-24

### エグゼクティブサマリー
本レポートは、既存のAWSリソースをTerraform管理下にインポートする実現可能性を分析します。インフラストラクチャ監査に基づき、ほとんどのリソースは適切な計画と実行により、Terraformに正常にインポートできます。

### 現在のTerraform環境
- **Terraformバージョン**: v1.9.2 (インストール済み、v1.12.2へのアップデート可能)
- **既存のステート管理**: Terraformステート用のS3バケットは設定済み
  - tano-tfstate-accounts
  - tano-tfstate-aft-setup
  - tano-tfstate-prd

### リソースタイプ別のインポート実現可能性

#### ✅ 完全にインポートサポート

##### 1. S3バケット
- **インポートサポート**: 完全対応
- **インポート対象リソース**: 4つのバケット
- **インポートコマンド例**:
  ```bash
  terraform import aws_s3_bucket.game_bucket tano-0603game-bucket
  terraform import aws_s3_bucket.tfstate_accounts tano-tfstate-accounts
  terraform import aws_s3_bucket.tfstate_aft tano-tfstate-aft-setup
  terraform import aws_s3_bucket.tfstate_prd tano-tfstate-prd
  ```
- **考慮事項**: 
  - バケットポリシー、バージョニング、ライフサイクルルールは個別にインポートが必要
  - ACLと暗号化設定は構成で定義する必要がある

##### 2. VPCリソース
- **インポートサポート**: 完全対応
- **インポート対象リソース**: 
  - 2つのVPC（デフォルト含む）
  - 2つのセキュリティグループ
- **インポートコマンド例**:
  ```bash
  terraform import aws_vpc.test vpc-07f75799fe37ee481
  terraform import aws_vpc.default vpc-0e2fa844a5940d043
  terraform import aws_security_group.default_custom sg-050a295e535b5b64f
  terraform import aws_security_group.default_main sg-08287ef75742730ca
  ```

##### 3. Route53
- **インポートサポート**: 完全対応
- **インポート対象リソース**: 1つのホストゾーン
- **インポートコマンド例**:
  ```bash
  terraform import aws_route53_zone.main Z0123456789ABC  # 実際のゾーンIDに置き換え
  ```

##### 4. IAMリソース
- **インポートサポート**: 完全対応（制限あり）
- **インポート対象リソース**:
  - ユーザー: 0603game-admin-tano
  - ロール: GitHubActionsRole-0603game-S3Sync
- **インポートコマンド例**:
  ```bash
  terraform import aws_iam_user.admin 0603game-admin-tano
  terraform import aws_iam_role.github_actions GitHubActionsRole-0603game-S3Sync
  ```
- **制限事項**: 
  - サービスリンクロールはTerraformで管理できない
  - AWS SSOロールはControl Towerで管理される

##### 5. CloudWatch
- **インポートサポート**: 完全対応
- **インポート対象リソース**: 1つのアラーム
- **インポートコマンド例**:
  ```bash
  terraform import aws_cloudwatch_metric_alarm.udemy udemy
  ```

#### ⚠️ 部分的または特別な考慮事項

##### 1. Control Towerリソース
- **インポートサポート**: 非推奨
- **理由**: AWS Control Towerで管理
- **リソース**:
  - CloudFormationスタック（BASELINEスタック）
  - Control Towerロール
  - ConfigとCloudTrailの設定
- **推奨事項**: Control Tower管理下に残す

##### 2. デフォルトリソース
- **インポートサポート**: 可能だが非推奨
- **リソース**: デフォルトVPCとセキュリティグループ
- **推奨事項**: 文書化するがインポートしない

### 推奨インポート戦略

#### フェーズ1: 準備
1. **Terraformのアップデート** を最新バージョン（1.12.2）に
2. **各リソースタイプのTerraform設定を作成**
3. **既存のS3ステートバケットを使用してバックエンド設定を構築**
4. **ワークスペース構造を作成**（dev、staging、prod）

#### フェーズ2: インポート実行順序
1. **基盤リソース**
   - S3バケット（ステートバケットを最初に）
   - VPCとネットワークリソース
   
2. **セキュリティリソース**
   - IAMユーザーとカスタムロール
   - セキュリティグループ
   
3. **アプリケーションリソース**
   - Route53ホストゾーン
   - アプリケーションS3バケット
   
4. **モニタリングリソース**
   - CloudWatchアラーム

#### フェーズ3: 検証
1. `terraform plan`を実行して変更がないことを確認
2. インポートしたリソースに不足している設定を追加
3. 小さな変更でテストしてステート管理を検証

### サンプルTerraform構造
```
terraform/
├── environments/
│   ├── prod/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── dev/
├── modules/
│   ├── s3/
│   ├── vpc/
│   ├── iam/
│   └── monitoring/
└── global/
    ├── iam/
    └── route53/
```

### リスク評価

#### 低リスク
- S3バケットのインポート
- VPCのインポート
- CloudWatchアラームのインポート

#### 中リスク
- IAMリソースのインポート（十分にテストする）
- セキュリティグループのインポート（ルールを検証）

#### 高リスク
- Control Tower管理リソースの変更
- リソースの削除と再作成

### インポートのベストプラクティス

1. **現在の状態をバックアップ**
   - インポート前に全リソースを文書化
   - 可能であればAWS Configスナップショットを取得

2. **分離してテスト**
   - 一度に1つのリソースをインポート
   - 各インポート後に`terraform plan`で検証

3. **インポートブロックを使用**（Terraform 1.5+）
   ```hcl
   import {
     to = aws_s3_bucket.game_bucket
     id = "tano-0603game-bucket"
   }
   ```

4. **バージョン管理**
   - 各成功したインポート後にコミット
   - 安定したインポートポイントにタグ付け

5. **チーム間のコミュニケーション**
   - インポート前にチームに通知
   - 手動ステップが必要な場合は文書化

### 自動化ツール

インポートを支援するこれらのツールの使用を検討：
1. **Terraformer**: 既存のインフラストラクチャからTerraformファイルを自動生成
2. **AWS Control Tower Account Factory for Terraform (AFT)**: S3バケットに基づいて既に設定済み
3. **terraform-import-generator**: インポートコマンドの生成を支援

### 結論

既存のAWSインフラストラクチャをTerraformにインポートすることは**非常に実現可能**で、以下の利点があります：
- 現在のインフラストラクチャはシンプルでインポートに適している
- ステート管理インフラストラクチャが既に存在
- ほとんどのリソースが完全なTerraformサポートを持つ

**推奨される次のステップ:**
1. Terraformを最新バージョンにアップデート
2. 低リスクな練習としてS3とVPCのインポートから開始
3. 段階的に残りのリソースをインポート
4. Control Tower管理リソースはそのまま残す
5. Terraformデプロイメント用の適切なCI/CDパイプラインを実装

適切な計画とテストにより、全体のインポートプロセスは約2〜3日で完了する見込みです。