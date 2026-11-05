# Profiles

Generated from `lib/profiles.mjs` by `node scripts/profiles-doc.mjs`; do not edit by hand.

On a `map`, a box (`nodes.<id>.kind`), a zone (`kind` on the zone) or a line (`kind` on the link) can say what it is on a platform: `"kind": "aws:rds"`, with that kind's fields in `props` (`{"engine": "postgres"}`, strings). Its icon follows the kind unless `icon` says otherwise. Leave `kind` out for anything the profiles do not cover: it is drawn as you write it. "Sits in" is where a kind usually goes: the page warns (never blocks) when the nearest zone with a kind is another one, and a zone without a kind says nothing. Kinds marked "box, also a zone" can be either: make it a zone when something runs inside it (an EC2 with its containers).

## aws (AWS)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `aws:account` Account | zone | anywhere |  |
| `aws:region` Region | zone | Account |  |
| `aws:vpc` VPC | zone | Account, Region | cidr |
| `aws:az` Availability Zone | zone | VPC, Region |  |
| `aws:subnet` Subnet | zone | VPC, Availability Zone | access: private / public; cidr |
| `aws:sg` Security group | zone (rules look through it) | VPC, Subnet, Availability Zone | rules |
| `aws:ec2` EC2 | box, also a zone | Subnet | type; os |
| `aws:ecs` ECS cluster | box, also a zone | VPC, Subnet, Region |  |
| `aws:fargate` Fargate task | box | ECS cluster, Subnet | cpu; memory |
| `aws:eks` EKS cluster | box, also a zone | VPC, Region | version |
| `aws:lambda` Lambda | box | Region, Account, VPC, Subnet | runtime |
| `aws:alb` Application Load Balancer | box | Subnet, VPC | scheme: internet-facing / internal |
| `aws:nlb` Network Load Balancer | box | Subnet, VPC | scheme: internet-facing / internal |
| `aws:internetgateway` Internet Gateway | box | VPC |  |
| `aws:natgateway` NAT Gateway | box | Subnet |  |
| `aws:endpoint` VPC endpoint | box | VPC, Subnet | service |
| `aws:transitgateway` Transit Gateway | box | Region, Account |  |
| `aws:vpn` Site-to-Site VPN | box | VPC, Region |  |
| `aws:directconnect` Direct Connect | box | Region, Account | bandwidth |
| `aws:apigateway` API Gateway | box | Region, Account | type: REST / HTTP / WebSocket |
| `aws:cloudfront` CloudFront | box | Account |  |
| `aws:route53` Route 53 | box | Account |  |
| `aws:waf` WAF | box | Account, Region |  |
| `aws:rds` RDS | box | Subnet, VPC | engine: postgres / mysql / mariadb / oracle / sqlserver; size; multiAz: yes / no |
| `aws:aurora` Aurora | box | Subnet, VPC | engine: postgres / mysql; size; serverless: yes / no |
| `aws:dynamodb` DynamoDB | box | Region, Account | capacity: on-demand / provisioned |
| `aws:elasticache` ElastiCache | box | Subnet, VPC | engine: redis / valkey / memcached; size |
| `aws:redshift` Redshift | box | Subnet, VPC |  |
| `aws:s3` S3 bucket | box | Region, Account | versioning: on / off |
| `aws:efs` EFS | box | VPC, Subnet |  |
| `aws:sqs` SQS queue | box | Region, Account | type: standard / fifo |
| `aws:sns` SNS topic | box | Region, Account |  |
| `aws:eventbridge` EventBridge | box | Region, Account |  |
| `aws:kinesis` Kinesis | box | Region, Account |  |
| `aws:msk` MSK (Kafka) | box | VPC, Subnet |  |
| `aws:stepfunctions` Step Functions | box | Region, Account |  |
| `aws:secretsmanager` Secrets Manager | box | Region, Account |  |
| `aws:kms` KMS key | box | Region, Account |  |
| `aws:iam` IAM role | box | Account |  |
| `aws:cognito` Cognito | box | Region, Account |  |
| `aws:cloudwatch` CloudWatch | box | Region, Account |  |
| `aws:ecr` ECR | box | Region, Account |  |
| `aws:ses` SES | box | Region, Account |  |
| `aws:athena` Athena | box | Region, Account |  |
| `aws:glue` Glue | box | Region, Account |  |
| `aws:bedrock` Bedrock | box | Region, Account |  |
| `aws:codepipeline` CodePipeline | box | Region, Account |  |

Lines: `aws:event` Event or message, `aws:peering` VPC peering, `aws:iam` Permission (IAM), `aws:replication` Replication; without a kind a line is traffic.
