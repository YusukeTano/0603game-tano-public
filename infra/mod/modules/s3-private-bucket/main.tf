resource "aws_s3_bucket" "main" {
  bucket = var.bucket_name
  tags   = var.tags
}

# バージョニング設定（修正済み）
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended" # ✅ 修正
  }
}

# ライフサイクルポリシー（常に作成）
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id # ✅ countを削除

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    # 追加：バケット全体を対象にする
    filter {}


    # 古いバージョンの削除（バージョニング停止後も有効）
    noncurrent_version_expiration {
      noncurrent_days = var.noncurrent_version_expiration_days
    }

    # 不完全なマルチパートアップロードも削除（追加推奨）
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.main.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}