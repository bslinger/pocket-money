terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Backend: local state for now
  # backend "s3" { ... }  # uncomment for remote state
}

provider "aws" {
  region  = var.region
  profile = var.aws_profile
}
