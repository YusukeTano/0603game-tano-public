variable "ct_management_account_id" {
  description = "Control Tower 管理アカウントの AWS アカウントID"
  type        = string
}

variable "aft_management_account_id" {
  description = "AFT 基盤をデプロイするアカウントID（管理アカウントと同じでもOK）"
  type        = string
}

variable "ct_home_region" {
  description = "Control Tower ホームリージョン（例: ap-northeast-1）"
  type        = string
  default     = "ap-northeast-1"
}
