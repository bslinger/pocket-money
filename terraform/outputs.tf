output "uploads_bucket" {
  description = "S3 uploads bucket name"
  value       = aws_s3_bucket.uploads.bucket
}

output "dev_access_key_id" {
  description = "IAM access key ID for local dev"
  value       = var.stage == "dev" ? aws_iam_access_key.dev[0].id : null
  sensitive   = false
}

output "dev_secret_access_key" {
  description = "IAM secret access key for local dev (sensitive)"
  value       = var.stage == "dev" ? aws_iam_access_key.dev[0].secret : null
  sensitive   = true
}

output "sqs_queue_url" {
  description = "SQS queue URL (prod only)"
  value       = var.stage == "prod" ? aws_sqs_queue.jobs[0].url : null
}

output "eb_endpoint" {
  description = "Elastic Beanstalk endpoint URL (prod only)"
  value       = var.stage == "prod" ? aws_elastic_beanstalk_environment.prod[0].endpoint_url : null
}
