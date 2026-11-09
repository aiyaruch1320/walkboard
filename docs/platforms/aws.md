# AWS

[Docs](../README.md) › [Platforms](README.md) › AWS

What boxes, zones and lines can be on AWS, and where each usually sits. On a map the page draws a kind's icon and fields, and shows a small amber ⚠ when something sits outside the zones listed here. That is a hint, never a block: if you mean it, it is fine. How profiles work: [Platforms](README.md).

![A small web app with a database and a job, drawn with AWS kinds](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/platforms/aws.png)

[Try it: click a box, see its kind and fields ↗](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=aws&step=all)

This page is generated from `skills/walkboard/lib/profiles.mjs`.

## Zones

Frames that hold other things.

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="account"></a>**Account** `aws:account` | anywhere |  |  |  |
| <a id="region"></a>**Region** `aws:region` | [Account](#account) |  |  |  |
| <a id="vpc"></a>**VPC** `aws:vpc` | [Account](#account), [Region](#region) |  |  | cidr |
| <a id="az"></a>**Availability Zone** `aws:az` | [VPC](#vpc), [Region](#region) |  |  |  |
| <a id="subnet"></a>**Subnet** `aws:subnet` | [VPC](#vpc), [Availability Zone](#az) |  |  | access (private, public); cidr |
| <a id="sg"></a>**Security group** `aws:sg` | [VPC](#vpc), [Subnet](#subnet), [Availability Zone](#az) | rules look through it to the zone around | security group, firewall | rules |

## Boxes

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="ec2"></a>**EC2** `aws:ec2` | [Subnet](#subnet) | a box, or a zone when something runs inside it; can run [Container](container.md) inside | vm, server, instance | type; os |
| <a id="ecs"></a>**ECS cluster** `aws:ecs` | [VPC](#vpc), [Subnet](#subnet), [Region](#region) | a box, or a zone when something runs inside it; can run [Container](container.md) inside | container |  |
| <a id="fargate"></a>**Fargate task** `aws:fargate` | [ECS cluster](#ecs), [Subnet](#subnet) |  | container, task | cpu; memory |
| <a id="eks"></a>**EKS cluster** `aws:eks` | [VPC](#vpc), [Region](#region) | a box, or a zone when something runs inside it; can run [Kubernetes](k8s.md) inside | kubernetes, k8s | version |
| <a id="lambda"></a>**Lambda** `aws:lambda` | [Region](#region), [Account](#account), [VPC](#vpc), [Subnet](#subnet) |  | function, serverless | runtime |
| <a id="alb"></a>**Application Load Balancer** `aws:alb` | [Subnet](#subnet), [VPC](#vpc) |  | lb, load balancer | scheme (internet-facing, internal) |
| <a id="nlb"></a>**Network Load Balancer** `aws:nlb` | [Subnet](#subnet), [VPC](#vpc) |  | lb, load balancer | scheme (internet-facing, internal) |
| <a id="internetgateway"></a>**Internet Gateway** `aws:internetgateway` | [VPC](#vpc) |  | igw |  |
| <a id="natgateway"></a>**NAT Gateway** `aws:natgateway` | [Subnet](#subnet) |  | nat |  |
| <a id="endpoint"></a>**VPC endpoint** `aws:endpoint` | [VPC](#vpc), [Subnet](#subnet) |  | privatelink, private link | service |
| <a id="transitgateway"></a>**Transit Gateway** `aws:transitgateway` | [Region](#region), [Account](#account) |  |  |  |
| <a id="vpn"></a>**Site-to-Site VPN** `aws:vpn` | [VPC](#vpc), [Region](#region) |  |  |  |
| <a id="directconnect"></a>**Direct Connect** `aws:directconnect` | [Region](#region), [Account](#account) |  |  | bandwidth |
| <a id="apigateway"></a>**API Gateway** `aws:apigateway` | [Region](#region), [Account](#account) |  | api | type (REST, HTTP, WebSocket) |
| <a id="cloudfront"></a>**CloudFront** `aws:cloudfront` | [Account](#account) |  | cdn |  |
| <a id="route53"></a>**Route 53** `aws:route53` | [Account](#account) |  | dns |  |
| <a id="waf"></a>**WAF** `aws:waf` | [Account](#account), [Region](#region) |  |  |  |
| <a id="rds"></a>**RDS** `aws:rds` | [Subnet](#subnet), [VPC](#vpc) |  | db, database, postgres, mysql | engine (postgres, mysql, mariadb, oracle, sqlserver); size; multiAz (yes, no) |
| <a id="aurora"></a>**Aurora** `aws:aurora` | [Subnet](#subnet), [VPC](#vpc) |  | db, database, postgres, mysql | engine (postgres, mysql); size; serverless (yes, no) |
| <a id="dynamodb"></a>**DynamoDB** `aws:dynamodb` | [Region](#region), [Account](#account) |  | db, nosql, table | capacity (on-demand, provisioned) |
| <a id="elasticache"></a>**ElastiCache** `aws:elasticache` | [Subnet](#subnet), [VPC](#vpc) |  | redis, cache, valkey | engine (redis, valkey, memcached); size |
| <a id="redshift"></a>**Redshift** `aws:redshift` | [Subnet](#subnet), [VPC](#vpc) |  |  |  |
| <a id="s3"></a>**S3 bucket** `aws:s3` | [Region](#region), [Account](#account) |  | bucket, object storage | versioning (on, off) |
| <a id="efs"></a>**EFS** `aws:efs` | [VPC](#vpc), [Subnet](#subnet) |  | nfs, file share |  |
| <a id="sqs"></a>**SQS queue** `aws:sqs` | [Region](#region), [Account](#account) |  | queue | type (standard, fifo) |
| <a id="sns"></a>**SNS topic** `aws:sns` | [Region](#region), [Account](#account) |  | topic, notification |  |
| <a id="eventbridge"></a>**EventBridge** `aws:eventbridge` | [Region](#region), [Account](#account) |  |  |  |
| <a id="kinesis"></a>**Kinesis** `aws:kinesis` | [Region](#region), [Account](#account) |  | stream |  |
| <a id="msk"></a>**MSK (Kafka)** `aws:msk` | [VPC](#vpc), [Subnet](#subnet) |  | kafka, stream |  |
| <a id="stepfunctions"></a>**Step Functions** `aws:stepfunctions` | [Region](#region), [Account](#account) |  |  |  |
| <a id="secretsmanager"></a>**Secrets Manager** `aws:secretsmanager` | [Region](#region), [Account](#account) |  | secret, password |  |
| <a id="kms"></a>**KMS key** `aws:kms` | [Region](#region), [Account](#account) |  |  |  |
| <a id="iam"></a>**IAM role** `aws:iam` | [Account](#account) |  | role, permission |  |
| <a id="cognito"></a>**Cognito** `aws:cognito` | [Region](#region), [Account](#account) |  | login, auth |  |
| <a id="cloudwatch"></a>**CloudWatch** `aws:cloudwatch` | [Region](#region), [Account](#account) |  | logs, monitor, alarm |  |
| <a id="ecr"></a>**ECR** `aws:ecr` | [Region](#region), [Account](#account) |  | registry, image |  |
| <a id="ses"></a>**SES** `aws:ses` | [Region](#region), [Account](#account) |  |  |  |
| <a id="athena"></a>**Athena** `aws:athena` | [Region](#region), [Account](#account) |  |  |  |
| <a id="glue"></a>**Glue** `aws:glue` | [Region](#region), [Account](#account) |  |  |  |
| <a id="bedrock"></a>**Bedrock** `aws:bedrock` | [Region](#region), [Account](#account) |  |  |  |
| <a id="codepipeline"></a>**CodePipeline** `aws:codepipeline` | [Region](#region), [Account](#account) |  |  |  |

## Lines

A line without a kind is traffic: one part calling another.

| Kind | Means |
|---|---|
| <a id="line-event"></a>`aws:event` | Event or message |
| <a id="line-peering"></a>`aws:peering` | VPC peering |
| <a id="line-iam"></a>`aws:iam` | Permission (IAM) |
| <a id="line-replication"></a>`aws:replication` | Replication |
