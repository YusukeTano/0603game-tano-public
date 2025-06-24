# main.tf

module "aft" {
  source  = "aws-ia/control_tower_account_factory/aws"
  version = "~> 1.14"

  # --- 必須パラメータ ---
  ct_management_account_id    = var.ct_management_account_id
  log_archive_account_id      = var.log_archive_account_id   # トップレベルで渡します
  audit_account_id            = var.audit_account_id         # トップレベルで渡します
  aft_management_account_id   = var.aft_management_account_id
  ct_home_region              = var.ct_home_region
  tf_backend_secondary_region = var.tf_backend_secondary_region

  # --- オプション: AFTが作成する「AFT基盤自体」のリソースに付けるタグ ---
  tags = {
    Owner   = "tano"
    Project = "0603game"
  }
}