resource "aws_sqs_queue" "jobs" {
  count                      = var.stage == "prod" ? 1 : 0
  name                       = "${var.app_name}-jobs-${var.stage}"
  visibility_timeout_seconds = 90
  message_retention_seconds  = 345600 # 4 days

  tags = {
    App   = var.app_name
    Stage = var.stage
  }
}
