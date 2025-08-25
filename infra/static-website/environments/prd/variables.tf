# infra/static-website/environments/prd/variables.tf

variable "project" {
  description = "プロジェクト名 (例: 0603game)"
  type        = string
}

variable "env" {
  description = "環境名 (prd, stg, dev)"
  type        = string
}

variable "base_domain" {
  description = "ベースとなるドメイン名 (例: tanoyuusuke.com)"
  type        = string
}

variable "aws_account_id" {
  description = "この環境のAWSアカウントID"
  type        = string
}

# ===== 追加する変数 =====

variable "dns_account_id" {
  description = "AWS Account ID for DNS management"
  type        = string
  # DNS管理アカウントは全環境共通なのでデフォルト値を設定しても良い
  default = "252170044718"
}

variable "include_www" {
  description = "Include www subdomain in CloudFront aliases"
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "リソースに適用する共通のタグ"
  type        = map(string)
  default     = {}
}