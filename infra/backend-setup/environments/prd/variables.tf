variable "project_name" {
  description = "プロジェクト名"
  type        = string
}

variable "environment" {
  description = "環境名"
  type        = string
}

variable "account_id" {
  description = "この環境のAWSアカウントID"
  type        = string
}

variable "common_tags" {
  description = "すべてのリソースに適用する共通のタグ"
  type        = map(string)
}
