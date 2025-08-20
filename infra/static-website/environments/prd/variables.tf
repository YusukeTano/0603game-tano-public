variable "project" {
  description = "プロジェクト名"
  type        = string
}

variable "environment" {
  description = "環境名（dev/stg/prd）"
  type        = string
}

variable "domain_name" {
  description = "ウェブサイトのドメイン名"
  type        = string
}

variable "aws_account_id" {
  description = "この環境のAWSアカウントID"
  type        = string
}

variable "common_tags" {
  description = "リソースに適用する共通のタグ"
  type        = map(string)
  default     = {}
}

