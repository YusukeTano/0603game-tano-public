# infra/static-website/environments/stg/terraform.tfvars

project      = "0603game"
env          = "stg"
base_domain  = "tanoyuusuke.com"
aws_account_id = "086266612383" # stgのアカウントID

# stgではwwwドメインは使使わないのでfalse
include_www    = false

# DNS管理アカウントはprdと同じ
dns_account_id = "252170044718"

common_tags = {
  ManagedBy = "Terraform"
}