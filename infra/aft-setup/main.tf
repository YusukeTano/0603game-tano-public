# main.tf

module "aft" {
  source  = "aws-ia/control_tower_account_factory/aws"
  version = "~> 1.14" # 最新の安定版であるv1.14系列を指定

  # Control Towerの必須情報を指定します
  ct_management_account_id  = var.ct_management_account_id
  aft_management_account_id = var.aft_management_account_id
  ct_home_region            = var.ct_home_region
  
  # Terraform stateを保存するS3バケットのレプリケーション先リージョン
  tf_backend_secondary_region = var.tf_backend_secondary_region
  
  # AFTが作成するアカウントにデフォルトで付与するタグ
  account_tags = {
    Owner   = "tano"
    Project = "0603game"
  }
}