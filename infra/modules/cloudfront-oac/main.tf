# S3オリジン用のOrigin Access Control (OAC) を作成
# これがCloudFrontからS3へ安全にアクセスするための「鍵」の役割を果たします
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "oac-for-${var.s3_origin_domain_name}"
  description                       = "OAC for S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFrontディストリビューションを作成
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html" # ルートURLへのアクセス時に表示するファイル
  aliases             = var.domain_aliases   # "tanoyuusuke.com" などを設定

  # オリジン（配信元）の設定
  origin {
    domain_name              = var.s3_origin_domain_name
    origin_id                = "S3-${var.s3_origin_domain_name}" # オリジンのユニークなID
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  # デフォルトのキャッシュ動作設定
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.s3_origin_domain_name}"
    viewer_protocol_policy = "redirect-to-https" # HTTPアクセスはHTTPSにリダイレクト
    compress               = true                # コンテンツを自動で圧縮して配信を高速化

    # AWSが推奨する一般的なキャッシュ最適化ポリシーを利用
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
  }

  # SSL/TLS証明書の設定
  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  # ← ここに追加（トップレベル）
  restrictions {
    geo_restriction {
      restriction_type = "none"   # 地理制限なし。whitelist/blacklist も選べる
      locations        = []        # none の場合は空配列
    }
  }

  # 価格クラス (日本を含むアジア、北米、欧州に限定してコストを最適化)
  price_class = "PriceClass_All"

  tags = var.tags
}
