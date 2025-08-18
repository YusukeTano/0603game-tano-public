output "acm_certificate_arn" {
  description = "発行されたACM証明書のARN"
  value       = module.acm.certificate_arn
}

output "s3_website_bucket_id" {
  description = "作成されたS3バケットのID"
  value       = module.s3_website.bucket_id
}
