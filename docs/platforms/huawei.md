# Huawei Cloud

[Docs](../README.md) › [Platforms](README.md) › Huawei Cloud

What boxes, zones and lines can be on Huawei Cloud, and where each usually sits. On a map the page draws a kind's icon and fields, and shows a small amber ⚠ when something sits outside the zones listed here. That is a hint, never a block: if you mean it, it is fine. How profiles work: [Platforms](README.md).

This page is generated from `skills/walkboard/lib/profiles.mjs`.

## Zones

Frames that hold other things.

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="region"></a>**Region** `huawei:region` | [Enterprise project](#enterpriseproject) |  |  |  |
| <a id="vpc"></a>**VPC** `huawei:vpc` | [Region](#region) |  |  | cidr |
| <a id="az"></a>**Availability Zone** `huawei:az` | [VPC](#vpc), [Region](#region) |  |  |  |
| <a id="subnet"></a>**Subnet** `huawei:subnet` | [VPC](#vpc), [Availability Zone](#az) |  |  | cidr |
| <a id="sg"></a>**Security group** `huawei:sg` | [VPC](#vpc), [Subnet](#subnet), [Availability Zone](#az) | rules look through it to the zone around | security group, firewall | rules |
| <a id="enterpriseproject"></a>**Enterprise project** `huawei:enterpriseproject` | anywhere |  | project, account |  |

## Boxes

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="ecs"></a>**ECS** `huawei:ecs` | [Subnet](#subnet) | a box, or a zone when something runs inside it; can run [Container](container.md) inside | vm, server, instance | flavor; os |
| <a id="cce"></a>**CCE cluster** `huawei:cce` | [VPC](#vpc), [Subnet](#subnet) | a box, or a zone when something runs inside it; can run [Kubernetes](k8s.md) inside | kubernetes, k8s |  |
| <a id="cci"></a>**CCI container** `huawei:cci` | [Region](#region), [Subnet](#subnet) |  | container |  |
| <a id="functiongraph"></a>**FunctionGraph** `huawei:functiongraph` | [Region](#region) |  |  |  |
| <a id="elb"></a>**ELB** `huawei:elb` | [Subnet](#subnet), [VPC](#vpc) |  | lb, load balancer |  |
| <a id="nat"></a>**NAT Gateway** `huawei:nat` | [VPC](#vpc), [Subnet](#subnet) |  |  |  |
| <a id="vpn"></a>**VPN** `huawei:vpn` | [VPC](#vpc), [Region](#region) |  |  |  |
| <a id="directconnect"></a>**Direct Connect** `huawei:directconnect` | [Region](#region) |  |  |  |
| <a id="er"></a>**Enterprise Router** `huawei:er` | [Region](#region) |  |  |  |
| <a id="apig"></a>**API Gateway** `huawei:apig` | [Region](#region), [VPC](#vpc) |  |  |  |
| <a id="waf"></a>**WAF** `huawei:waf` | [Region](#region) |  |  |  |
| <a id="cdn"></a>**CDN** `huawei:cdn` | anywhere |  |  |  |
| <a id="dns"></a>**DNS** `huawei:dns` | anywhere |  |  |  |
| <a id="rds"></a>**RDS** `huawei:rds` | [Subnet](#subnet), [VPC](#vpc) |  | db, database | engine (mysql, postgres, sqlserver, mariadb); flavor |
| <a id="gaussdb"></a>**GaussDB** `huawei:gaussdb` | [Subnet](#subnet), [VPC](#vpc) |  |  |  |
| <a id="dcs"></a>**DCS (Redis / Memcached)** `huawei:dcs` | [Subnet](#subnet), [VPC](#vpc) |  | redis, cache, memcached | engine (redis, memcached) |
| <a id="obs"></a>**OBS bucket** `huawei:obs` | [Region](#region) |  | bucket |  |
| <a id="sfs"></a>**Scalable File Service** `huawei:sfs` | [VPC](#vpc), [Subnet](#subnet) |  | nfs, file share, sfs turbo | type (SFS, SFS Turbo) |
| <a id="evs"></a>**EVS disk** `huawei:evs` | [Availability Zone](#az), [Subnet](#subnet) |  |  |  |
| <a id="smn"></a>**SMN topic** `huawei:smn` | [Region](#region) |  |  |  |
| <a id="dms"></a>**DMS (Kafka / RabbitMQ / RocketMQ)** `huawei:dms` | [VPC](#vpc), [Subnet](#subnet) |  | kafka, queue, rabbitmq, rocketmq | engine (kafka, rabbitmq, rocketmq) |
| <a id="iam"></a>**IAM** `huawei:iam` | anywhere |  |  |  |
| <a id="kms"></a>**KMS (Data Encryption Workshop)** `huawei:kms` | [Region](#region) |  | dew, key, secret |  |
| <a id="ces"></a>**Cloud Eye** `huawei:ces` | [Region](#region) |  |  |  |
| <a id="lts"></a>**Log Tank Service** `huawei:lts` | [Region](#region) |  |  |  |
| <a id="swr"></a>**SWR registry** `huawei:swr` | [Region](#region) |  | registry, image |  |
| <a id="flexus"></a>**Flexus instance** `huawei:flexus` | [Subnet](#subnet) | a box, or a zone when something runs inside it; can run [Container](container.md) inside | vm, server, lightweight | flavor; os |
| <a id="bms"></a>**Bare Metal Server** `huawei:bms` | [Subnet](#subnet) | a box, or a zone when something runs inside it; can run [Container](container.md) inside | bare metal, physical server | flavor; os |
| <a id="as"></a>**Auto Scaling group** `huawei:as` | [Subnet](#subnet), [VPC](#vpc) | a box, or a zone when something runs inside it; can run [Container](container.md) inside | autoscaling, scaling group | min; max |
| <a id="gpu"></a>**GPU Accelerated Cloud Server** `huawei:gpu` | [Subnet](#subnet) |  | gpu, gacs | flavor |
| <a id="cae"></a>**Cloud Application Engine** `huawei:cae` | [Region](#region), [VPC](#vpc) |  | serverless, container, paas |  |
| <a id="servicestage"></a>**ServiceStage** `huawei:servicestage` | [Region](#region), [VPC](#vpc) |  | paas, microservice |  |
| <a id="cse"></a>**Cloud Service Engine** `huawei:cse` | [VPC](#vpc), [Subnet](#subnet) |  | microservice, service registry, mesh |  |
| <a id="eip"></a>**Elastic IP** `huawei:eip` | [VPC](#vpc), [Region](#region) |  | public ip | bandwidth |
| <a id="vpcep"></a>**VPC Endpoint** `huawei:vpcep` | [VPC](#vpc), [Subnet](#subnet) |  | private link, endpoint |  |
| <a id="cloudconnect"></a>**Cloud Connect** `huawei:cloudconnect` | [Region](#region) |  | cross-region, backbone |  |
| <a id="ga"></a>**Global Accelerator** `huawei:ga` | [Region](#region) |  | acceleration, anycast |  |
| <a id="aad"></a>**Anti-DDoS** `huawei:aad` | [Region](#region) |  | ddos |  |
| <a id="cfw"></a>**Cloud Firewall** `huawei:cfw` | [Region](#region), [VPC](#vpc) |  | firewall |  |
| <a id="hss"></a>**Host Security Service** `huawei:hss` | [Region](#region) |  | antivirus, edr, host security |  |
| <a id="cbh"></a>**Cloud Bastion Host** `huawei:cbh` | [Subnet](#subnet), [VPC](#vpc) |  | bastion, jump host |  |
| <a id="dbss"></a>**Database Security Service** `huawei:dbss` | [Subnet](#subnet), [VPC](#vpc) |  | database audit |  |
| <a id="ccm"></a>**Cloud Certificate Manager** `huawei:ccm` | [Region](#region) |  | tls, ssl, certificate |  |
| <a id="secmaster"></a>**SecMaster** `huawei:secmaster` | [Region](#region) |  | siem, soc, security |  |
| <a id="taurusdb"></a>**TaurusDB** `huawei:taurusdb` | [Subnet](#subnet), [VPC](#vpc) |  | mysql, db, database | flavor |
| <a id="geminidb"></a>**GeminiDB** `huawei:geminidb` | [Subnet](#subnet), [VPC](#vpc) |  | nosql, redis, cassandra, influxdb | api (redis, cassandra, mongodb, influx) |
| <a id="dds"></a>**Document Database Service** `huawei:dds` | [Subnet](#subnet), [VPC](#vpc) |  | mongodb, document, nosql |  |
| <a id="ddm"></a>**Distributed Database Middleware** `huawei:ddm` | [Subnet](#subnet), [VPC](#vpc) |  | sharding |  |
| <a id="drs"></a>**Data Replication Service** `huawei:drs` | [Region](#region), [VPC](#vpc), [Subnet](#subnet) |  | migration, cdc, replication |  |
| <a id="dws"></a>**Data Warehouse Service** `huawei:dws` | [Subnet](#subnet), [VPC](#vpc) |  | warehouse, gaussdb dws |  |
| <a id="mrs"></a>**MapReduce Service** `huawei:mrs` | [Subnet](#subnet), [VPC](#vpc) |  | hadoop, spark, big data |  |
| <a id="dli"></a>**Data Lake Insight** `huawei:dli` | [Region](#region) |  | spark, flink, data lake |  |
| <a id="css"></a>**Cloud Search Service** `huawei:css` | [Subnet](#subnet), [VPC](#vpc) |  | search, elasticsearch, opensearch |  |
| <a id="dataarts"></a>**DataArts Studio** `huawei:dataarts` | [Region](#region) |  | etl, data governance, pipeline |  |
| <a id="dis"></a>**Data Ingestion Service** `huawei:dis` | [Region](#region) |  | stream, ingest |  |
| <a id="roma"></a>**ROMA Connect** `huawei:roma` | [Region](#region), [VPC](#vpc) |  | integration, esb, connector |  |
| <a id="cbr"></a>**Cloud Backup and Recovery** `huawei:cbr` | [Region](#region) |  | backup |  |
| <a id="aom"></a>**Application Operations Management** `huawei:aom` | [Region](#region) |  | apm, monitor, prometheus |  |
| <a id="cts"></a>**Cloud Trace Service** `huawei:cts` | [Region](#region) |  | audit, audit log |  |
| <a id="codearts"></a>**CodeArts Pipeline** `huawei:codearts` | [Region](#region) |  | ci, cd, pipeline, devops |  |
| <a id="modelarts"></a>**ModelArts / MaaS** `huawei:modelarts` | [Region](#region) |  | ai, ml, pangu, llm |  |

## Lines

A line without a kind is traffic: one part calling another.

| Kind | Means |
|---|---|
| <a id="line-event"></a>`huawei:event` | Event or message |
| <a id="line-peering"></a>`huawei:peering` | VPC peering |
| <a id="line-iam"></a>`huawei:iam` | Permission (IAM) |
