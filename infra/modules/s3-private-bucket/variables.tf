variable "bucket_name" {
  description = "作成するS3バケットの名前"
  type        = string
}

variable "tags" {
  description = "リソースに適用するタグ"
  type        = map(string)
  default     = {}
}

variable "enable_versioning" {
  description = "バージョニングを有効にする場合はtrue"
  type        = bool
  default     = true # デフォルトで有効にする
}

variable "noncurrent_version_expiration_days" {
  description = "古いバージョンを自動削除するまでの日数"
  type        = number
  default     = 90 # デフォルトは90日
}
