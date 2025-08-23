# infra/backend-setup/environments/stg/backend.tf

terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}