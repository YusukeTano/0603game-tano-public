# infra/static-website/environments/dev/terraform.tfvars

project        = "0603game"
env            = "dev"
base_domain    = "tanoyuusuke.com"
aws_account_id = "330723288310" # devのアカウントID

# devではwwwドメインは使わないのでfalse
include_www = false

# DNS管理アカウントはprdと同じ
dns_account_id = "252170044718"

common_tags = {
  ManagedBy = "Terraform"
}