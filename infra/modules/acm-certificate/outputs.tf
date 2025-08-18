output "certificate_arn" {
  description = "発行されたACM証明書のARN"
  value       = aws_acm_certificate.main.arn
}
