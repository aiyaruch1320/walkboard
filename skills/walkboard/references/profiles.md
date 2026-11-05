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

## gcp (Google Cloud)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `gcp:org` Organization | zone | anywhere |  |
| `gcp:project` Project | zone | Organization |  |
| `gcp:vpc` VPC network | zone | Project |  |
| `gcp:region` Region | zone | Project, VPC network |  |
| `gcp:zone` Zone | zone | Region |  |
| `gcp:subnet` Subnet | zone | VPC network, Region | cidr |
| `gcp:firewall` Firewall rule | zone (rules look through it) | VPC network, Subnet | rules |
| `gcp:gce` Compute Engine VM | box, also a zone | Subnet, Zone | type; os |
| `gcp:gke` GKE cluster | box, also a zone | VPC network, Region, Subnet | mode: autopilot / standard |
| `gcp:cloudrun` Cloud Run | box | Region, Project | cpu; memory |
| `gcp:functions` Cloud Functions | box | Region, Project | runtime |
| `gcp:loadbalancer` Load balancer | box | Project, VPC network, Region | scheme: external / internal |
| `gcp:armor` Cloud Armor | box | Project |  |
| `gcp:cdn` Cloud CDN | box | Project |  |
| `gcp:dns` Cloud DNS | box | Project |  |
| `gcp:nat` Cloud NAT | box | Region, VPC network |  |
| `gcp:vpn` Cloud VPN | box | Region, VPC network |  |
| `gcp:interconnect` Cloud Interconnect | box | Region, Project |  |
| `gcp:cloudsql` Cloud SQL | box | Region, VPC network, Project | engine: postgres / mysql / sqlserver; tier; ha: yes / no |
| `gcp:spanner` Spanner | box | Region, Project |  |
| `gcp:firestore` Firestore | box | Region, Project |  |
| `gcp:memorystore` Memorystore | box | VPC network, Region | engine: redis / valkey / memcached; size |
| `gcp:bigquery` BigQuery | box | Region, Project |  |
| `gcp:gcs` Cloud Storage bucket | box | Region, Project | class: standard / nearline / coldline / archive |
| `gcp:pubsub` Pub/Sub topic | box | Project |  |
| `gcp:dataflow` Dataflow | box | Region, Project |  |
| `gcp:composer` Composer (Airflow) | box | Region, Project |  |
| `gcp:scheduler` Cloud Scheduler | box | Region, Project | schedule |
| `gcp:secretmanager` Secret Manager | box | Project |  |
| `gcp:kms` Cloud KMS | box | Region, Project |  |
| `gcp:iam` Service account | box | Project |  |
| `gcp:logging` Cloud Logging | box | Project |  |
| `gcp:monitoring` Cloud Monitoring | box | Project |  |
| `gcp:artifactregistry` Artifact Registry | box | Region, Project |  |
| `gcp:vertexai` Vertex AI | box | Region, Project |  |

Lines: `gcp:event` Event or message, `gcp:peering` VPC peering, `gcp:iam` Permission (IAM), `gcp:replication` Replication; without a kind a line is traffic.

## azure (Azure)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `azure:subscription` Subscription | zone | anywhere |  |
| `azure:resourcegroup` Resource group | zone | Subscription |  |
| `azure:region` Region | zone | Subscription, Resource group |  |
| `azure:vnet` Virtual network | zone | Resource group, Region, Subscription | cidr |
| `azure:subnet` Subnet | zone | Virtual network | cidr |
| `azure:nsg` Network security group | zone (rules look through it) | Virtual network, Subnet | rules |
| `azure:vm` Virtual machine | box, also a zone | Subnet | size; os |
| `azure:aks` AKS cluster | box, also a zone | Virtual network, Subnet, Resource group |  |
| `azure:appservice` App Service | box | Resource group, Region, Subnet | plan |
| `azure:functions` Functions | box | Resource group, Region | runtime |
| `azure:appgateway` Application Gateway | box | Subnet, Virtual network |  |
| `azure:loadbalancer` Load Balancer | box | Subnet, Virtual network, Resource group | scheme: public / internal |
| `azure:frontdoor` Front Door | box | Subscription, Resource group |  |
| `azure:firewall` Azure Firewall | box | Subnet, Virtual network |  |
| `azure:vpngateway` VPN Gateway | box | Subnet, Virtual network |  |
| `azure:expressroute` ExpressRoute | box | Resource group, Region, Subscription |  |
| `azure:apim` API Management | box | Resource group, Subnet |  |
| `azure:sql` Azure SQL | box | Resource group, Region | tier |
| `azure:postgres` Database for PostgreSQL | box | Resource group, Subnet, Region | tier |
| `azure:cosmosdb` Cosmos DB | box | Resource group, Region | api: nosql / mongodb / cassandra / gremlin / table |
| `azure:redis` Azure Cache for Redis | box | Resource group, Subnet, Region | tier |
| `azure:storage` Storage account | box | Resource group, Region | kind: blob / files / queue / table |
| `azure:servicebus` Service Bus | box | Resource group, Region |  |
| `azure:eventhubs` Event Hubs | box | Resource group, Region |  |
| `azure:eventgrid` Event Grid | box | Resource group, Region |  |
| `azure:keyvault` Key Vault | box | Resource group, Region |  |
| `azure:entra` Entra ID | box | Subscription |  |
| `azure:monitor` Azure Monitor | box | Subscription, Resource group |  |
| `azure:acr` Container Registry | box | Resource group, Region |  |
| `azure:openai` Azure OpenAI | box | Resource group, Region |  |

Lines: `azure:event` Event or message, `azure:peering` VNet peering, `azure:iam` Permission (RBAC), `azure:replication` Replication; without a kind a line is traffic.

## huawei (Huawei Cloud)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `huawei:region` Region | zone | anywhere |  |
| `huawei:vpc` VPC | zone | Region | cidr |
| `huawei:az` Availability Zone | zone | VPC, Region |  |
| `huawei:subnet` Subnet | zone | VPC, Availability Zone | cidr |
| `huawei:sg` Security group | zone (rules look through it) | VPC, Subnet, Availability Zone | rules |
| `huawei:ecs` ECS | box, also a zone | Subnet | flavor; os |
| `huawei:cce` CCE cluster | box, also a zone | VPC, Subnet |  |
| `huawei:cci` CCI container | box | Region, Subnet |  |
| `huawei:functiongraph` FunctionGraph | box | Region |  |
| `huawei:elb` ELB | box | Subnet, VPC |  |
| `huawei:nat` NAT Gateway | box | VPC, Subnet |  |
| `huawei:vpn` VPN | box | VPC, Region |  |
| `huawei:directconnect` Direct Connect | box | Region |  |
| `huawei:er` Enterprise Router | box | Region |  |
| `huawei:apig` API Gateway | box | Region, VPC |  |
| `huawei:waf` WAF | box | Region |  |
| `huawei:cdn` CDN | box | anywhere |  |
| `huawei:dns` DNS | box | anywhere |  |
| `huawei:rds` RDS | box | Subnet, VPC | engine: mysql / postgres / sqlserver; flavor |
| `huawei:gaussdb` GaussDB | box | Subnet, VPC |  |
| `huawei:dcs` DCS (Redis) | box | Subnet, VPC |  |
| `huawei:obs` OBS bucket | box | Region |  |
| `huawei:sfs` SFS | box | VPC, Subnet |  |
| `huawei:evs` EVS disk | box | Availability Zone, Subnet |  |
| `huawei:smn` SMN topic | box | Region |  |
| `huawei:dms` DMS (Kafka / RabbitMQ) | box | VPC, Subnet |  |
| `huawei:iam` IAM | box | anywhere |  |
| `huawei:kms` KMS | box | Region |  |
| `huawei:ces` Cloud Eye | box | Region |  |
| `huawei:lts` Log Tank Service | box | Region |  |
| `huawei:swr` SWR registry | box | Region |  |

Lines: `huawei:event` Event or message, `huawei:peering` VPC peering, `huawei:iam` Permission (IAM); without a kind a line is traffic.

## onprem (On-prem)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `onprem:datacenter` Data center | zone | anywhere |  |
| `onprem:rack` Rack | zone | Data center |  |
| `onprem:vlan` VLAN / network segment | zone | Data center, DMZ | id; cidr |
| `onprem:dmz` DMZ | zone | Data center |  |
| `onprem:server` Physical server | box, also a zone | Rack, Data center, VLAN / network segment, DMZ | cpu; memory; os |
| `onprem:vm` Virtual machine | box, also a zone | Physical server, VLAN / network segment, Data center, DMZ | cpu; memory; os |
| `onprem:firewall` Firewall | box | Data center, Rack, DMZ, VLAN / network segment | model |
| `onprem:router` Router | box | Data center, Rack |  |
| `onprem:switch` Switch | box | Data center, Rack, VLAN / network segment |  |
| `onprem:loadbalancer` Load balancer | box | Data center, Rack, DMZ, VLAN / network segment | model |
| `onprem:vpn` VPN gateway | box | Data center, DMZ |  |
| `onprem:database` Database | box | Physical server, Virtual machine, VLAN / network segment, Data center | engine |
| `onprem:storage` Storage (NAS / SAN) | box | Data center, Rack, VLAN / network segment | size |
| `onprem:directory` Directory (AD / LDAP) | box | Physical server, Virtual machine, VLAN / network segment, Data center |  |

Lines: `onprem:replication` Replication, `onprem:backup` Backup; without a kind a line is traffic.

## container (Container)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `container:host` Container host | zone | anywhere | runtime: docker / podman / containerd; os |
| `container:compose` Compose project | zone | Container host |  |
| `container:network` Container network | zone | Container host, Compose project | driver: bridge / host / overlay |
| `container:container` Container | box | Container host, Compose project, Container network | image; ports; replicas |
| `container:volume` Volume | box | Container host, Compose project | mount |
| `container:envfile` Env / config file | box | Container host, Compose project |  |
| `container:registry` Image registry | box | anywhere |  |

Lines: `container:uses` Mounts or reads; without a kind a line is traffic.

## k8s (Kubernetes)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `k8s:cluster` Cluster | zone | anywhere | version |
| `k8s:namespace` Namespace | zone | Cluster |  |
| `k8s:networkpolicy` Network policy | zone (rules look through it) | Namespace | rules |
| `k8s:deployment` Deployment | box | Namespace | replicas; image; containers |
| `k8s:statefulset` StatefulSet | box | Namespace | replicas; image; containers |
| `k8s:daemonset` DaemonSet | box | Namespace | image; containers |
| `k8s:cronjob` CronJob | box | Namespace | schedule; image; containers; suspended: yes / no |
| `k8s:job` Job | box | Namespace | image; containers |
| `k8s:pod` Pod | box | Namespace | image; containers |
| `k8s:service` Service | box | Namespace | type: ClusterIP / NodePort / LoadBalancer; port |
| `k8s:ingress` Ingress | box | Namespace | host |
| `k8s:configmap` ConfigMap | box | Namespace |  |
| `k8s:secret` Secret | box | Namespace |  |
| `k8s:pvc` PersistentVolumeClaim | box | Namespace | size; storageClass |
| `k8s:hpa` HorizontalPodAutoscaler | box | Namespace | min; max |
| `k8s:serviceaccount` ServiceAccount | box | Namespace |  |

Lines: `k8s:uses` Reads config or secret, `k8s:mounts` Mounts a volume, `k8s:selects` Selects pods, `k8s:routes` Routes to; without a kind a line is traffic.
