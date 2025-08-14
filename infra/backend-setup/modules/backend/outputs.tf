output "s3_bucket_name" {
  description = "Terraformステート用のS3バケット名"
  value       = aws_s3_bucket.tfstate.bucket
}

output "dynamodb_table_name" {
  description = "Terraformステートロック用のDynamoDBテーブル名"
  value       = aws_dynamodb_table.tflock.name
}
