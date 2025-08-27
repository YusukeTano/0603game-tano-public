# modules/acm-certificate/variables.tf

variable "domain_name" {
  description = "証明書を発行するドメイン名（例: stg.tanoyuusuke.com）"
  type        = string
}

variable "base_domain" {
  description = "Route53ホストゾーンの親ドメイン名（例: tanoyuusuke.com）"
  type        = string
}

variable "subject_alternative_names" {
  description = "証明書に含める追加のドメイン名 (SANs)"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "リソースに適用するタグ"
  type        = map(string)
  default     = {}
}