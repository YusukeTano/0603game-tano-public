# ── AFT 用バックエンド ──
resource "aws_s3_bucket" "aft" {
  provider = aws.mgmt
  bucket   = "tano-tfstate-aft-setup"

  tags = {
    Owner       = "tano"
    Project     = "0603game"
    environment = "root"
  }
}

resource "aws_s3_bucket_versioning" "aft" {
  provider = aws.mgmt
  bucket   = aws_s3_bucket.aft.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "aft" {
  provider = aws.mgmt
  bucket   = aws_s3_bucket.aft.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "aft_lock" {
  provider     = aws.mgmt
  name         = "tano-tflock-aft"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Owner       = "tano"
    Project     = "0603game"
    environment = "root"
  }
}

# ── Accounts 用バックエンド ──
resource "aws_s3_bucket" "accounts" {
  provider = aws.mgmt
  bucket   = "tano-tfstate-accounts"

  tags = {
    Owner       = "tano"
    Project     = "0603game"
    environment = "root"
  }
}

resource "aws_s3_bucket_versioning" "accounts" {
  provider = aws.mgmt
  bucket   = aws_s3_bucket.accounts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "accounts" {
  provider = aws.mgmt
  bucket   = aws_s3_bucket.accounts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "accounts_lock" {
  provider     = aws.mgmt
  name         = "tano-tflock-accounts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Owner       = "tano"
    Project     = "0603game"
    environment = "root"
  }
}

# ── prd 用バックエンド ──
resource "aws_s3_bucket" "prd" {
  provider = aws.mgmt
  bucket   = "tano-tfstate-prd"

  tags = {
    Owner       = "tano"
    Project     = "0603game"
    environment = "root"
  }
}

resource "aws_s3_bucket_versioning" "prd" {
  provider = aws.mgmt
  bucket   = aws_s3_bucket.prd.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "prd" {
  provider = aws.mgmt
  bucket   = aws_s3_bucket.prd.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "prd_lock" {
  provider     = aws.mgmt
  name         = "tano-tflock-prd"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Owner       = "tano"
    Project     = "0603game"
    environment = "root"
  }
}
