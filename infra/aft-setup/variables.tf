# variables.tf

variable "ct_management_account_id" {
  description = "Control Tower 管理アカウントの AWS アカウントID"
  type        = string
}

variable "aft_management_account_id" {
  description = "AFT 基盤をデプロイするアカウントID（管理アカウントと同じでもOK）"
  type        = string
}

variable "ct_home_region" {
  description = "Control Tower ホームリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "tf_backend_secondary_region" {
  description = "Terraform state S3バケットのDR用セカンダリリージョン"
  type        = string
  default     = "ap-northeast-1" # 学習用なのでホームリージョンと同じでOK
}

variable "log_archive_account_id" {
  description = "Control Tower が作成した LogArchive アカウントの AWS アカウントID"
  type        = string
}

variable "audit_account_id" {
  description = "Control Tower が作成した Audit アカウントの AWS アカウントID"
  type        = string
}