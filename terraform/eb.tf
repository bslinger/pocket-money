resource "aws_elastic_beanstalk_application" "app" {
  count       = var.stage == "prod" ? 1 : 0
  name        = var.app_name
  description = "Pocket Money Tracker"
}

# PHP 8.3 running on Amazon Linux 2023
data "aws_elastic_beanstalk_solution_stack" "php83" {
  count       = var.stage == "prod" ? 1 : 0
  most_recent = true
  name_regex  = "^64bit Amazon Linux 2023 .* PHP 8.3.*$"
}

resource "aws_elastic_beanstalk_environment" "prod" {
  count               = var.stage == "prod" ? 1 : 0
  name                = "${var.app_name}-prod"
  application         = aws_elastic_beanstalk_application.app[0].name
  solution_stack_name = data.aws_elastic_beanstalk_solution_stack.php83[0].name

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = var.eb_instance_type
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.eb[0].name
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "EnvironmentType"
    value     = "SingleInstance"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "APP_ENV"
    value     = "production"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "APP_DEBUG"
    value     = "false"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_CONNECTION"
    value     = "pgsql"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "QUEUE_CONNECTION"
    value     = "sqs"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_DEFAULT_REGION"
    value     = var.region
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_BUCKET"
    value     = aws_s3_bucket.uploads.bucket
  }

  # Cron: run recurring transactions every hour
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "RUN_SCHEDULER"
    value     = "true"
  }

  tags = {
    App   = var.app_name
    Stage = var.stage
  }
}
