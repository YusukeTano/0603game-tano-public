module "backend" {
  source = "../../modules/backend"

  project_name = var.project_name
  environment  = var.environment
  account_id   = var.account_id
  common_tags  = var.common_tags
}

