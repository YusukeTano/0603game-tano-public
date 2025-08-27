variable "zone_name" {
  description = "対象のRoute 53ホストゾーン名"
  type        = string
}

variable "records" {
  description = "作成するDNSレコードのリスト"
  type = list(object({
    name    = string
    type    = string
    ttl     = optional(number, 300)
    content = optional(list(string), [])
    alias = optional(object({
      name    = string
      zone_id = string
    }), null)
  }))
  default = []
}
