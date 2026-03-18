# IAM user for local dev (not used in prod — EB uses instance role)
resource "aws_iam_user" "dev" {
  count = var.stage == "dev" ? 1 : 0
  name  = "${var.app_name}-dev-user"
}

resource "aws_iam_access_key" "dev" {
  count = var.stage == "dev" ? 1 : 0
  user  = aws_iam_user.dev[0].name
}

resource "aws_iam_user_policy" "dev" {
  count = var.stage == "dev" ? 1 : 0
  name  = "${var.app_name}-dev-policy"
  user  = aws_iam_user.dev[0].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:GetObjectAttributes"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      }
    ]
  })
}

# IAM instance role for Elastic Beanstalk (prod)
resource "aws_iam_role" "eb_instance" {
  count = var.stage == "prod" ? 1 : 0
  name  = "${var.app_name}-eb-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "eb_instance" {
  count = var.stage == "prod" ? 1 : 0
  name  = "${var.app_name}-eb-instance-policy"
  role  = aws_iam_role.eb_instance[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject", "s3:GetObject", "s3:DeleteObject",
          "s3:GetObjectAttributes"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = var.stage == "prod" ? aws_sqs_queue.jobs[0].arn : "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "eb" {
  count = var.stage == "prod" ? 1 : 0
  name  = "${var.app_name}-eb-instance-profile"
  role  = aws_iam_role.eb_instance[0].name
}

# Attach standard EB managed policies
resource "aws_iam_role_policy_attachment" "eb_web_tier" {
  count      = var.stage == "prod" ? 1 : 0
  role       = aws_iam_role.eb_instance[0].name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}
