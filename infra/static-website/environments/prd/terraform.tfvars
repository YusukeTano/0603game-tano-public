# infra/static-website/environments/prd/terraform.tfvars

project      = "0603game"
env          = "prd"
base_domain  = "tanoyuusuke.com"
aws_account_id = "002540791269"
dns_account_id = "252170044718"  # 明示的に指定
include_www    = true             # www.tanoyuusuke.comも使用

common_tags = {
  ManagedBy = "Terraform"
}