locals {
  project     = var.project
  env         = var.env         # "prd" | "stg" | "dev"
  base_domain = var.base_domain # "tanoyuusuke.com"

  fqdn           = local.env == "prd" ? local.base_domain : "${local.env}.${local.base_domain}"
  www_fqdn       = local.env == "prd" ? "www.${local.base_domain}" : "www.${local.fqdn}"
  domain_aliases = var.include_www ? [local.fqdn, local.www_fqdn] : [local.fqdn]

  # 親ゾーンは常に固定
  zone_name = local.base_domain

  # 一意な名前（アカウントID入り）
  bucket_name = "bucket-${local.project}-${local.env}-${var.aws_account_id}"

  # OACは64文字制限に注意（長いなら切詰め）
  _oac     = "oac-${local.project}-${local.env}"
  oac_name = length(local._oac) > 64 ? substr(local._oac, 0, 64) : local._oac

  # 共通タグ合成
  tags = merge(var.common_tags, {
    Project     = local.project
    Environment = local.env
    ManagedBy   = "Terraform"
  })

  # ロールARNも “計算” に寄せられるなら寄せる（ばらつくなら var で渡す）
  execution_role_arn   = "arn:aws:iam::${var.aws_account_id}:role/TerraformExecutionRole-${local.env}"
  dns_manager_role_arn = "arn:aws:iam::${var.dns_account_id}:role/Route53CrossAccountManagerRole"
}


