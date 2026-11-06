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
| `gcp:folder` Folder | zone | Organization, Folder |  |
| `gcp:project` Project | zone | Organization, Folder, Shared VPC host project, VPC Service Controls perimeter |  |
| `gcp:vpc` VPC network | zone | Project |  |
| `gcp:region` Region | zone | Project, VPC network |  |
| `gcp:zone` Zone | zone | Region |  |
| `gcp:subnet` Subnet | zone | VPC network, Region | cidr |
| `gcp:firewall` Firewall rule | zone (rules look through it) | VPC network, Subnet | rules |
| `gcp:gce` Compute Engine VM | box, also a zone | Subnet, Zone | type; os |
| `gcp:gke` GKE cluster | box, also a zone | VPC network, Region, Subnet | mode: autopilot / standard |
| `gcp:cloudrun` Cloud Run | box | Region, Project, Subnet, VPC network | cpu; memory |
| `gcp:functions` Cloud Functions | box | Region, Project, Subnet, VPC network | runtime |
| `gcp:loadbalancer` Load balancer | box | Project, VPC network, Region | scheme: external / internal |
| `gcp:psc` Private Service Connect endpoint | box | Subnet, VPC network |  |
| `gcp:iap` Identity-Aware Proxy | box | Project |  |
| `gcp:apigee` Apigee | box | Project, Region |  |
| `gcp:armor` Cloud Armor | box | Project, Region |  |
| `gcp:cdn` Cloud CDN | box | Project |  |
| `gcp:dns` Cloud DNS | box | Project |  |
| `gcp:nat` Cloud NAT | box | Region, VPC network |  |
| `gcp:vpn` Cloud VPN | box | Region, VPC network |  |
| `gcp:interconnect` Cloud Interconnect | box | Region, Project |  |
| `gcp:cloudsql` Cloud SQL | box | Region, VPC network, Project, Subnet | engine: postgres / mysql / sqlserver; tier; ha: yes / no |
| `gcp:spanner` Spanner | box | Region, Project |  |
| `gcp:firestore` Firestore | box | Region, Project |  |
| `gcp:memorystore` Memorystore | box | VPC network, Region, Subnet, Project | engine: redis / valkey / memcached; size |
| `gcp:alloydb` AlloyDB | box | VPC network, Region, Subnet |  |
| `gcp:filestore` Filestore | box | VPC network, Region, Zone |  |
| `gcp:bigquery` BigQuery | box | Region, Project |  |
| `gcp:gcs` Cloud Storage bucket | box | Region, Project | class: standard / nearline / coldline / archive |
| `gcp:pubsub` Pub/Sub topic | box | Project, Region |  |
| `gcp:dataflow` Dataflow | box | Region, Project |  |
| `gcp:composer` Managed Airflow (Composer) | box | Region, Project |  |
| `gcp:scheduler` Cloud Scheduler | box | Region, Project | schedule |
| `gcp:cloudtasks` Cloud Tasks | box | Region, Project |  |
| `gcp:cloudbuild` Cloud Build | box | Region, Project |  |
| `gcp:secretmanager` Secret Manager | box | Project |  |
| `gcp:kms` Cloud KMS | box | Region, Project |  |
| `gcp:iam` Service account | box | Project |  |
| `gcp:logging` Cloud Logging | box | Project |  |
| `gcp:monitoring` Cloud Monitoring | box | Project |  |
| `gcp:artifactregistry` Artifact Registry | box | Region, Project |  |
| `gcp:vertexai` Vertex AI / Agent Platform | box | Region, Project |  |
| `gcp:sharedvpc` Shared VPC host project | zone | Organization, Folder |  |
| `gcp:perimeter` VPC Service Controls perimeter | zone (rules look through it) | Organization, Folder |  |
| `gcp:mig` Managed instance group | box, also a zone | Subnet, Zone, Region | min; max; type |
| `gcp:disk` Persistent Disk / Hyperdisk | box | Zone, Region, Subnet | size; type |
| `gcp:appengine` App Engine | box | Region, Project |  |
| `gcp:batch` Batch | box | Region, Project, Subnet |  |
| `gcp:vmwareengine` VMware Engine | box, also a zone | Region, VPC network, Project |  |
| `gcp:apigateway` API Gateway | box | Region, Project |  |
| `gcp:eventarc` Eventarc trigger | box | Region, Project |  |
| `gcp:workflows` Workflows | box | Region, Project |  |
| `gcp:clouddeploy` Cloud Deploy | box | Region, Project |  |
| `gcp:sourcemanager` Secure Source Manager | box | Region, Project |  |
| `gcp:router` Cloud Router | box | Region, VPC network |  |
| `gcp:ncc` Network Connectivity Center | box | Project, Organization |  |
| `gcp:ngfw` Cloud NGFW policy | box | VPC network, Project, Organization, Folder |  |
| `gcp:ids` Cloud IDS | box | VPC network, Region |  |
| `gcp:swp` Secure Web Proxy | box | VPC network, Region, Subnet |  |
| `gcp:servicemesh` Cloud Service Mesh | box | Project, VPC network |  |
| `gcp:bigtable` Bigtable | box | Region, Project, Zone | nodes |
| `gcp:datastream` Datastream | box | Region, Project |  |
| `gcp:dms` Database Migration Service | box | Region, Project |  |
| `gcp:kafka` Managed Service for Apache Kafka | box | Region, VPC network, Subnet |  |
| `gcp:dataproc` Managed Service for Apache Spark (Dataproc) | box | Region, Subnet, Project |  |
| `gcp:datafusion` Cloud Data Fusion | box | Region, Project |  |
| `gcp:dataform` Dataform | box | Region, Project |  |
| `gcp:looker` Looker | box | Region, Project |  |
| `gcp:netappvolumes` NetApp Volumes | box | Region, VPC network |  |
| `gcp:backupdr` Backup and DR | box | Region, Project |  |
| `gcp:certificatemanager` Certificate Manager | box | Project, Region |  |
| `gcp:identityplatform` Identity Platform | box | Project |  |
| `gcp:managedad` Managed Microsoft AD | box | VPC network, Project |  |
| `gcp:scc` Security Command Center | box | Organization, Project |  |
| `gcp:trace` Cloud Trace | box | Project |  |
| `gcp:documentai` Document AI | box | Region, Project |  |

Lines: `gcp:event` Event or message, `gcp:peering` VPC peering, `gcp:iam` Permission (IAM), `gcp:replication` Replication; without a kind a line is traffic.

## azure (Azure)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `azure:subscription` Subscription | zone | Management group |  |
| `azure:managementgroup` Management group | zone | Management group |  |
| `azure:resourcegroup` Resource group | zone | Subscription |  |
| `azure:region` Region | zone | Subscription, Resource group |  |
| `azure:vnet` Virtual network | zone | Resource group, Region, Subscription | cidr |
| `azure:availabilityzone` Availability Zone | zone | Region, Virtual network |  |
| `azure:subnet` Subnet | zone | Virtual network | cidr |
| `azure:nsg` Network security group | zone (rules look through it) | Virtual network, Subnet | rules |
| `azure:vm` Virtual machine | box, also a zone | Subnet | size; os |
| `azure:aks` AKS cluster | box, also a zone | Virtual network, Subnet, Resource group |  |
| `azure:appservice` App Service | box | Resource group, Region, Subnet | plan |
| `azure:functions` Functions | box | Resource group, Region | runtime |
| `azure:containerapps` Container Apps | box | Resource group, Region, Subnet |  |
| `azure:aci` Container Instances | box | Resource group, Subnet |  |
| `azure:logicapps` Logic Apps | box | Resource group, Region |  |
| `azure:appgateway` Application Gateway | box | Subnet, Virtual network |  |
| `azure:loadbalancer` Load Balancer | box | Subnet, Virtual network, Resource group | scheme: public / internal |
| `azure:frontdoor` Front Door | box | Subscription, Resource group |  |
| `azure:firewall` Azure Firewall | box | Subnet, Virtual network |  |
| `azure:privateendpoint` Private endpoint | box | Subnet |  |
| `azure:privatednszone` Private DNS zone | box | Resource group, Virtual network |  |
| `azure:bastion` Bastion | box | Subnet, Virtual network |  |
| `azure:natgateway` NAT Gateway | box | Subnet, Virtual network |  |
| `azure:vpngateway` VPN Gateway | box | Subnet, Virtual network |  |
| `azure:expressroute` ExpressRoute | box | Resource group, Region, Subscription |  |
| `azure:apim` API Management | box | Resource group, Subnet |  |
| `azure:sql` Azure SQL | box | Resource group, Region, Subnet, Virtual network | tier |
| `azure:postgres` Database for PostgreSQL | box | Resource group, Subnet, Region | tier |
| `azure:cosmosdb` Cosmos DB | box | Resource group, Region, Subnet, Virtual network | api: nosql / mongodb / cassandra / gremlin / table |
| `azure:redis` Azure Managed Redis | box | Resource group, Subnet, Region | tier |
| `azure:storage` Storage account | box | Resource group, Region, Subnet, Virtual network | kind: blob / files / queue / table |
| `azure:servicebus` Service Bus | box | Resource group, Region, Subnet, Virtual network |  |
| `azure:eventhubs` Event Hubs | box | Resource group, Region, Subnet, Virtual network |  |
| `azure:eventgrid` Event Grid | box | Resource group, Region |  |
| `azure:keyvault` Key Vault | box | Resource group, Region, Subnet, Virtual network |  |
| `azure:entra` Entra ID | box | Subscription |  |
| `azure:managedidentity` Managed identity | box | Resource group, Subscription |  |
| `azure:monitor` Azure Monitor | box | Subscription, Resource group |  |
| `azure:acr` Container Registry | box | Resource group, Region, Subnet, Virtual network |  |
| `azure:openai` Azure OpenAI / Foundry | box | Resource group, Region |  |
| `azure:vmss` VM scale set | box, also a zone | Subnet | min; max; size |
| `azure:disk` Managed disk | box | Resource group, Region, Availability Zone | size; sku |
| `azure:aro` Azure Red Hat OpenShift | box, also a zone | Virtual network, Subnet, Resource group |  |
| `azure:staticwebapps` Static Web Apps | box | Resource group, Region |  |
| `azure:batch` Batch | box | Resource group, Subnet |  |
| `azure:avd` Azure Virtual Desktop | box | Resource group, Subnet, Virtual network |  |
| `azure:vmware` Azure VMware Solution | box, also a zone | Resource group, Region |  |
| `azure:appconfig` App Configuration | box | Resource group, Region, Subnet |  |
| `azure:sqlmi` SQL Managed Instance | box | Subnet, Virtual network | tier |
| `azure:mysql` Database for MySQL | box | Resource group, Subnet, Region | tier |
| `azure:documentdb` Azure DocumentDB (MongoDB) | box | Resource group, Region, Subnet, Virtual network |  |
| `azure:files` Azure Files share | box | Resource group, Region, Subnet, Virtual network |  |
| `azure:netappfiles` Azure NetApp Files | box | Subnet, Virtual network |  |
| `azure:datalake` Data Lake Storage | box | Resource group, Region, Subnet, Virtual network |  |
| `azure:datafactory` Data Factory | box | Resource group, Region |  |
| `azure:synapse` Synapse Analytics | box | Resource group, Region |  |
| `azure:databricks` Azure Databricks | box | Resource group, Virtual network |  |
| `azure:fabric` Microsoft Fabric | box | Subscription, Resource group |  |
| `azure:streamanalytics` Stream Analytics | box | Resource group, Region |  |
| `azure:dataexplorer` Data Explorer | box | Resource group, Region, Subnet |  |
| `azure:powerbi` Power BI | box | Subscription |  |
| `azure:signalr` SignalR Service | box | Resource group, Region |  |
| `azure:webpubsub` Web PubSub | box | Resource group, Region |  |
| `azure:notificationhubs` Notification Hubs | box | Resource group, Region |  |
| `azure:communication` Communication Services | box | Resource group, Region |  |
| `azure:iothub` IoT Hub | box | Resource group, Region |  |
| `azure:dns` Azure DNS zone | box | Resource group, Subscription |  |
| `azure:trafficmanager` Traffic Manager | box | Resource group, Subscription |  |
| `azure:waf` Web Application Firewall policy | box | Resource group, Subscription |  |
| `azure:ddos` DDoS Protection plan | box | Resource group, Subscription, Virtual network |  |
| `azure:vwan` Virtual WAN hub | box, also a zone | Resource group, Region, Subscription |  |
| `azure:routeserver` Route Server | box | Subnet, Virtual network |  |
| `azure:privatelinkservice` Private Link service | box | Subnet, Virtual network |  |
| `azure:loganalytics` Log Analytics workspace | box | Resource group, Region |  |
| `azure:appinsights` Application Insights | box | Resource group, Region |  |
| `azure:grafana` Managed Grafana | box | Resource group, Region |  |
| `azure:sentinel` Microsoft Sentinel | box | Resource group, Subscription |  |
| `azure:defender` Defender for Cloud | box | Subscription |  |
| `azure:backup` Backup vault | box | Resource group, Region |  |
| `azure:siterecovery` Site Recovery | box | Resource group, Region |  |
| `azure:arc` Azure Arc | box | Resource group, Subscription |  |
| `azure:externalid` Entra External ID | box | Subscription |  |
| `azure:aisearch` Azure AI Search | box | Resource group, Region, Subnet, Virtual network |  |
| `azure:machinelearning` Azure Machine Learning | box | Resource group, Region |  |
| `azure:documentintelligence` Document Intelligence | box | Resource group, Region |  |
| `azure:devops` Azure DevOps / Pipelines | box | anywhere |  |

Lines: `azure:event` Event or message, `azure:peering` VNet peering, `azure:iam` Permission (RBAC), `azure:replication` Replication; without a kind a line is traffic.

## huawei (Huawei Cloud)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `huawei:region` Region | zone | Enterprise project |  |
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
| `huawei:rds` RDS | box | Subnet, VPC | engine: mysql / postgres / sqlserver / mariadb; flavor |
| `huawei:gaussdb` GaussDB | box | Subnet, VPC |  |
| `huawei:dcs` DCS (Redis / Memcached) | box | Subnet, VPC | engine: redis / memcached |
| `huawei:obs` OBS bucket | box | Region |  |
| `huawei:sfs` Scalable File Service | box | VPC, Subnet | type: SFS / SFS Turbo |
| `huawei:evs` EVS disk | box | Availability Zone, Subnet |  |
| `huawei:smn` SMN topic | box | Region |  |
| `huawei:dms` DMS (Kafka / RabbitMQ / RocketMQ) | box | VPC, Subnet | engine: kafka / rabbitmq / rocketmq |
| `huawei:iam` IAM | box | anywhere |  |
| `huawei:kms` KMS (Data Encryption Workshop) | box | Region |  |
| `huawei:ces` Cloud Eye | box | Region |  |
| `huawei:lts` Log Tank Service | box | Region |  |
| `huawei:swr` SWR registry | box | Region |  |
| `huawei:enterpriseproject` Enterprise project | zone | anywhere |  |
| `huawei:flexus` Flexus instance | box, also a zone | Subnet | flavor; os |
| `huawei:bms` Bare Metal Server | box, also a zone | Subnet | flavor; os |
| `huawei:as` Auto Scaling group | box, also a zone | Subnet, VPC | min; max |
| `huawei:gpu` GPU Accelerated Cloud Server | box | Subnet | flavor |
| `huawei:cae` Cloud Application Engine | box | Region, VPC |  |
| `huawei:servicestage` ServiceStage | box | Region, VPC |  |
| `huawei:cse` Cloud Service Engine | box | VPC, Subnet |  |
| `huawei:eip` Elastic IP | box | VPC, Region | bandwidth |
| `huawei:vpcep` VPC Endpoint | box | VPC, Subnet |  |
| `huawei:cloudconnect` Cloud Connect | box | Region |  |
| `huawei:ga` Global Accelerator | box | Region |  |
| `huawei:aad` Anti-DDoS | box | Region |  |
| `huawei:cfw` Cloud Firewall | box | Region, VPC |  |
| `huawei:hss` Host Security Service | box | Region |  |
| `huawei:cbh` Cloud Bastion Host | box | Subnet, VPC |  |
| `huawei:dbss` Database Security Service | box | Subnet, VPC |  |
| `huawei:ccm` Cloud Certificate Manager | box | Region |  |
| `huawei:secmaster` SecMaster | box | Region |  |
| `huawei:taurusdb` TaurusDB | box | Subnet, VPC | flavor |
| `huawei:geminidb` GeminiDB | box | Subnet, VPC | api: redis / cassandra / mongodb / influx |
| `huawei:dds` Document Database Service | box | Subnet, VPC |  |
| `huawei:ddm` Distributed Database Middleware | box | Subnet, VPC |  |
| `huawei:drs` Data Replication Service | box | Region, VPC, Subnet |  |
| `huawei:dws` Data Warehouse Service | box | Subnet, VPC |  |
| `huawei:mrs` MapReduce Service | box | Subnet, VPC |  |
| `huawei:dli` Data Lake Insight | box | Region |  |
| `huawei:css` Cloud Search Service | box | Subnet, VPC |  |
| `huawei:dataarts` DataArts Studio | box | Region |  |
| `huawei:dis` Data Ingestion Service | box | Region |  |
| `huawei:roma` ROMA Connect | box | Region, VPC |  |
| `huawei:cbr` Cloud Backup and Recovery | box | Region |  |
| `huawei:aom` Application Operations Management | box | Region |  |
| `huawei:cts` Cloud Trace Service | box | Region |  |
| `huawei:codearts` CodeArts Pipeline | box | Region |  |
| `huawei:modelarts` ModelArts / MaaS | box | Region |  |

Lines: `huawei:event` Event or message, `huawei:peering` VPC peering, `huawei:iam` Permission (IAM); without a kind a line is traffic.

## onprem (On-prem)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `onprem:datacenter` Data center | zone | anywhere |  |
| `onprem:rack` Rack | zone | Data center |  |
| `onprem:vlan` VLAN / network segment | zone | Data center, DMZ, Site / office / branch | id; cidr |
| `onprem:dmz` DMZ | zone | Data center, Site / office / branch |  |
| `onprem:server` Physical server | box, also a zone | Rack, Data center, VLAN / network segment, DMZ, Site / office / branch | cpu; memory; os |
| `onprem:vm` Virtual machine | box, also a zone | Physical server, VLAN / network segment, Data center, DMZ, Virtualization cluster, Hypervisor host | cpu; memory; os |
| `onprem:firewall` Firewall | box | Data center, Rack, DMZ, VLAN / network segment, Site / office / branch | model |
| `onprem:router` Router | box | Data center, Rack, Site / office / branch |  |
| `onprem:switch` Switch | box | Data center, Rack, VLAN / network segment, Site / office / branch |  |
| `onprem:loadbalancer` Load balancer | box | Data center, Rack, DMZ, VLAN / network segment | model |
| `onprem:vpn` VPN gateway | box | Data center, DMZ, Site / office / branch |  |
| `onprem:database` Database | box | Physical server, Virtual machine, VLAN / network segment, Data center | engine |
| `onprem:storage` Storage (NAS / SAN) | box | Data center, Rack, VLAN / network segment | size |
| `onprem:directory` Directory (AD / LDAP) | box | Physical server, Virtual machine, VLAN / network segment, Data center |  |
| `onprem:site` Site / office / branch | zone | anywhere |  |
| `onprem:cluster` Virtualization cluster | zone | Data center, Rack, VLAN / network segment |  |
| `onprem:hypervisor` Hypervisor host | box, also a zone | Rack, Data center, Virtualization cluster, VLAN / network segment | cpu; memory |
| `onprem:appserver` Application server | box, also a zone | Physical server, Virtual machine, VLAN / network segment, Data center, DMZ | platform |
| `onprem:proxy` Proxy (forward / reverse) | box | DMZ, VLAN / network segment, Data center, Physical server, Virtual machine |  |
| `onprem:waf` Web application firewall | box | DMZ, Data center, Rack, VLAN / network segment |  |
| `onprem:ids` IDS / IPS | box | Data center, Rack, DMZ, VLAN / network segment |  |
| `onprem:dnsserver` DNS / DHCP server | box | Physical server, Virtual machine, VLAN / network segment, Data center, DMZ |  |
| `onprem:mailserver` Mail server | box | Physical server, Virtual machine, VLAN / network segment, Data center, DMZ |  |
| `onprem:fileserver` File server | box | Physical server, Virtual machine, VLAN / network segment, Data center |  |
| `onprem:objectstorage` Object storage | box | Data center, Rack, VLAN / network segment, Physical server, Virtual machine |  |
| `onprem:backupserver` Backup server / tape | box | Data center, Rack, VLAN / network segment |  |
| `onprem:cache` Cache | box | Physical server, Virtual machine, VLAN / network segment, Data center |  |
| `onprem:mq` Message queue | box | Physical server, Virtual machine, VLAN / network segment, Data center |  |
| `onprem:mainframe` Mainframe | box | Data center, Rack |  |
| `onprem:siem` SIEM / log server | box | Physical server, Virtual machine, VLAN / network segment, Data center |  |
| `onprem:monitoring` Monitoring | box | Physical server, Virtual machine, VLAN / network segment, Data center |  |
| `onprem:bastion` Jump host / PAM | box | VLAN / network segment, DMZ, Data center, Physical server, Virtual machine |  |
| `onprem:hsm` HSM | box | Data center, Rack |  |
| `onprem:cicd` CI/CD server | box | Physical server, Virtual machine, VLAN / network segment, Data center |  |
| `onprem:accesspoint` Wi-Fi access point | box | Site / office / branch, VLAN / network segment |  |

Lines: `onprem:replication` Replication, `onprem:backup` Backup, `onprem:wan` WAN / VPN link; without a kind a line is traffic.

## container (Container)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `container:host` Container host | zone | Swarm cluster | runtime: docker / podman / containerd; os |
| `container:compose` Compose project | zone | Container host |  |
| `container:network` Container network | zone | Container host, Compose project | driver: bridge / host / overlay / macvlan / ipvlan |
| `container:container` Container | box | Container host, Compose project, Container network, Podman pod, Swarm cluster | image; ports; replicas; restart: no / always / unless-stopped / on-failure |
| `container:volume` Volume | box | Container host, Compose project, Swarm cluster | mount; driver |
| `container:envfile` Env / config file | box | Container host, Compose project |  |
| `container:registry` Image registry | box | anywhere |  |
| `container:swarm` Swarm cluster | zone | anywhere |  |
| `container:pod` Podman pod | box, also a zone | Container host, Container network |  |
| `container:proxy` Reverse proxy | box | Container host, Compose project, Container network, Swarm cluster | ports |
| `container:secret` Secret | box | Container host, Compose project, Swarm cluster |  |
| `container:config` Config | box | Container host, Compose project, Swarm cluster |  |
| `container:bindmount` Bind mount (host folder) | box | Container host, Compose project | path |

Lines: `container:uses` Mounts or reads, `container:depends` Starts after (depends_on), `container:publishes` Publishes a port; without a kind a line is traffic.

## k8s (Kubernetes)

| Kind | Is | Sits in | props |
|---|---|---|---|
| `k8s:cluster` Cluster | zone | anywhere | version |
| `k8s:namespace` Namespace | zone | Cluster |  |
| `k8s:networkpolicy` Network policy | zone (rules look through it) | Namespace | rules |
| `k8s:deployment` Deployment | box | Namespace | replicas; image; containers |
| `k8s:statefulset` StatefulSet | box | Namespace | replicas; image; containers |
| `k8s:daemonset` DaemonSet | box | Namespace, Node, Node pool | image; containers |
| `k8s:cronjob` CronJob | box | Namespace | schedule; image; containers; suspended: yes / no |
| `k8s:job` Job | box | Namespace | image; containers |
| `k8s:pod` Pod | box | Namespace, Node, Node pool | image; containers |
| `k8s:service` Service | box | Namespace | type: ClusterIP / NodePort / LoadBalancer / ExternalName / Headless; port |
| `k8s:ingress` Ingress | box | Namespace | host |
| `k8s:configmap` ConfigMap | box | Namespace |  |
| `k8s:secret` Secret | box | Namespace |  |
| `k8s:pvc` PersistentVolumeClaim | box | Namespace | size; storageClass |
| `k8s:pv` PersistentVolume | box | Cluster | size |
| `k8s:hpa` HorizontalPodAutoscaler | box | Namespace | min; max |
| `k8s:serviceaccount` ServiceAccount | box | Namespace |  |
| `k8s:role` Role / RoleBinding | box | Namespace |  |
| `k8s:nodepool` Node pool | zone | Cluster | size; machine |
| `k8s:node` Node | box, also a zone | Cluster, Node pool | machine |
| `k8s:mesh` Service mesh | zone (rules look through it) | Cluster, Namespace |  |
| `k8s:replicaset` ReplicaSet | box | Namespace | replicas |
| `k8s:operator` Operator / controller | box | Namespace |  |
| `k8s:gateway` Gateway (Gateway API) | box | Namespace | class; listeners |
| `k8s:route` Route (HTTPRoute, GRPCRoute…) | box | Namespace | type: HTTP / GRPC / TLS / TCP; host |
| `k8s:pdb` PodDisruptionBudget | box | Namespace | minAvailable |
| `k8s:vpa` VerticalPodAutoscaler | box | Namespace |  |
| `k8s:scaledobject` ScaledObject (KEDA) | box | Namespace | trigger |
| `k8s:resourcequota` ResourceQuota / LimitRange | box | Namespace |  |
| `k8s:storageclass` StorageClass | box | Cluster | provisioner |
| `k8s:clusterrole` ClusterRole / ClusterRoleBinding | box | Cluster |  |
| `k8s:crd` CustomResourceDefinition | box | Cluster |  |
| `k8s:certificate` Certificate (cert-manager) | box | Namespace |  |
| `k8s:externalsecret` ExternalSecret | box | Namespace |  |
| `k8s:gitopsapp` GitOps app (Argo CD / Flux) | box | Namespace, Cluster |  |

Lines: `k8s:uses` Reads config or secret, `k8s:mounts` Mounts a volume, `k8s:selects` Selects pods, `k8s:routes` Routes to, `k8s:scales` Scales; without a kind a line is traffic.
