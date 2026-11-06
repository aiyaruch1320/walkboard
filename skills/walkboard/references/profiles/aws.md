# aws (AWS)

Each line: kind and name; `zone` or `also zone` (else a box); in = where it usually sits; props. How to use them: views/map.md.

- `aws:account` Account · zone
- `aws:region` Region · zone · in Account
- `aws:vpc` VPC · zone · in Account, Region · cidr
- `aws:az` Availability Zone · zone · in VPC, Region
- `aws:subnet` Subnet · zone · in VPC, Availability Zone · access: private / public; cidr
- `aws:sg` Security group · zone (rules look through it) · in VPC, Subnet, Availability Zone · rules
- `aws:ec2` EC2 · also zone · in Subnet · type; os
- `aws:ecs` ECS cluster · also zone · in VPC, Subnet, Region
- `aws:fargate` Fargate task · in ECS cluster, Subnet · cpu; memory
- `aws:eks` EKS cluster · also zone · in VPC, Region · version
- `aws:lambda` Lambda · in Region, Account, VPC, Subnet · runtime
- `aws:alb` Application Load Balancer · in Subnet, VPC · scheme: internet-facing / internal
- `aws:nlb` Network Load Balancer · in Subnet, VPC · scheme: internet-facing / internal
- `aws:internetgateway` Internet Gateway · in VPC
- `aws:natgateway` NAT Gateway · in Subnet
- `aws:endpoint` VPC endpoint · in VPC, Subnet · service
- `aws:transitgateway` Transit Gateway · in Region, Account
- `aws:vpn` Site-to-Site VPN · in VPC, Region
- `aws:directconnect` Direct Connect · in Region, Account · bandwidth
- `aws:apigateway` API Gateway · in Region, Account · type: REST / HTTP / WebSocket
- `aws:cloudfront` CloudFront · in Account
- `aws:route53` Route 53 · in Account
- `aws:waf` WAF · in Account, Region
- `aws:rds` RDS · in Subnet, VPC · engine: postgres / mysql / mariadb / oracle / sqlserver; size; multiAz: yes / no
- `aws:aurora` Aurora · in Subnet, VPC · engine: postgres / mysql; size; serverless: yes / no
- `aws:dynamodb` DynamoDB · in Region, Account · capacity: on-demand / provisioned
- `aws:elasticache` ElastiCache · in Subnet, VPC · engine: redis / valkey / memcached; size
- `aws:redshift` Redshift · in Subnet, VPC
- `aws:s3` S3 bucket · in Region, Account · versioning: on / off
- `aws:efs` EFS · in VPC, Subnet
- `aws:sqs` SQS queue · in Region, Account · type: standard / fifo
- `aws:sns` SNS topic · in Region, Account
- `aws:eventbridge` EventBridge · in Region, Account
- `aws:kinesis` Kinesis · in Region, Account
- `aws:msk` MSK (Kafka) · in VPC, Subnet
- `aws:stepfunctions` Step Functions · in Region, Account
- `aws:secretsmanager` Secrets Manager · in Region, Account
- `aws:kms` KMS key · in Region, Account
- `aws:iam` IAM role · in Account
- `aws:cognito` Cognito · in Region, Account
- `aws:cloudwatch` CloudWatch · in Region, Account
- `aws:ecr` ECR · in Region, Account
- `aws:ses` SES · in Region, Account
- `aws:athena` Athena · in Region, Account
- `aws:glue` Glue · in Region, Account
- `aws:bedrock` Bedrock · in Region, Account
- `aws:codepipeline` CodePipeline · in Region, Account

Lines: `aws:event` Event or message, `aws:peering` VPC peering, `aws:iam` Permission (IAM), `aws:replication` Replication; without a kind a line is traffic.
