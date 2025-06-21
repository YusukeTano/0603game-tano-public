module "aft" {
  source                      = "aws-ia/control_tower_account_factory/aws"
  version                     = "1.9.0"            # 最新バージョンに置き換えてください
  ct_management_account_id    = var.ct_management_account_id
  aft_management_account_id   = var.aft_management_account_id
  ct_home_region              = var.ct_home_region

  # （必要に応じて）組織単位やタグなどのカスタマイズパラメータ
  # ou_name_workloads          = "Workloads"
  # default_tagmap             = { Owner = "tano", Project = "0603game" }
}
