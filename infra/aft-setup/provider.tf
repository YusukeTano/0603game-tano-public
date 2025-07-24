# provider.tf

# デフォルトのAWSプロバイダ設定
provider "aws" {
  region  = "ap-northeast-1"
  # 使用するSSOプロファイルを明示的に指定
  profile = "AdministratorAccess-252170044718-0603game-sso"
}

# Control Tower管理アカウントを操作するためのエイリアス付きプロバイダ
provider "aws" {
  alias   = "mgmt"
  region  = "ap-northeast-1"
  # こちらも同じSSOプロファイルを指定
  profile = "AdministratorAccess-252170044718-0603game-sso"
}