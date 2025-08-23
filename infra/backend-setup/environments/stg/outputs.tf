output "backend_s3_bucket_name" {
  description = "Terraformステート用のS3バケット名"
  value       = module.backend.s3_bucket_name
}

output "backend_dynamodb_table_name" {
  description = "Terraformステートロック用のDynamoDBテーブル名"
  value       = module.backend.dynamodb_table_name
}
