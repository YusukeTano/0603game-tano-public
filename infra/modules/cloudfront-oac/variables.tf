# infra/modules/cloudfront-oac/variables.tf

variable "s3_origin_domain_name" {
  description = "オリジンとなるS3バケットのリージョナルドメイン名"
  type        = string
}

variable "acm_certificate_arn" {
  description = "使用するACM証明書のARN (us-east-1で作成されたもの)"
  type        = string
}

variable "domain_aliases" {
  description = "ディストリビューションに設定するドメイン名のリスト (CNAME)"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "リソースに適用するタグ"
  type        = map(string)
  default     = {}
}
