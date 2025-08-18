variable "domain_name" {
  description = "証明書を発行するドメイン名"
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
