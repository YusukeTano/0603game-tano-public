# provider.tf

# デフォルトのAWSプロバイダ
provider "aws" {
  region  = "ap-northeast-1"
}

# Control Tower管理アカウントを操作するためのエイリアス付きプロバイダ
provider "aws" {
  alias   = "mgmt"
  region  = "ap-northeast-1"
}