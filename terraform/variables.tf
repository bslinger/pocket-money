variable "app_name" {
  description = "Application name"
  type        = string
  default     = "pocket-money"
}

variable "stage" {
  description = "Deployment stage (dev or prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "aws_profile" {
  description = "AWS CLI profile to use"
  type        = string
  default     = "default"
}

variable "ses_email_identity" {
  description = "Email address or domain to verify with SES"
  type        = string
  default     = "noreply@pocketmoney.app"
}

variable "eb_instance_type" {
  description = "EC2 instance type for Elastic Beanstalk"
  type        = string
  default     = "t3.micro"
}

variable "db_url" {
  description = "Database URL (Neon PostgreSQL connection string)"
  type        = string
  sensitive   = true
  default     = ""
}
