# Google Cloud

This page lists every Google Cloud kind that Walkboard knows: the boxes, zones and lines you can draw on a [map](../pictures/map.md), and where each one usually sits.

When a box has one of these kinds, the map shows its icon and fields. If you put it somewhere other than the zones listed under "Usually in", a small amber ⚠ appears next to its name. It is only a hint, so if you mean it, that is fine. To learn how kinds work, see [Platforms](README.md).

![A small web app with a database and a job, drawn with Google Cloud kinds](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/platforms/gcp.png)

[Open this map in the live example and click a box to see its kind ↗](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=gcp&step=all)

## Zones

A zone is a frame that holds boxes and other zones.

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="org"></a>**Organization** `gcp:org` | anywhere |  |  |  |
| <a id="folder"></a>**Folder** `gcp:folder` | [Organization](#org), [Folder](#folder) |  |  |  |
| <a id="project"></a>**Project** `gcp:project` | [Organization](#org), [Folder](#folder), [Shared VPC host project](#sharedvpc), [VPC Service Controls perimeter](#perimeter) |  |  |  |
| <a id="vpc"></a>**VPC network** `gcp:vpc` | [Project](#project) |  |  |  |
| <a id="region"></a>**Region** `gcp:region` | [Project](#project), [VPC network](#vpc) |  |  |  |
| <a id="zone"></a>**Zone** `gcp:zone` | [Region](#region) |  |  |  |
| <a id="subnet"></a>**Subnet** `gcp:subnet` | [VPC network](#vpc), [Region](#region) |  |  | cidr |
| <a id="firewall"></a>**Firewall rule** `gcp:firewall` | [VPC network](#vpc), [Subnet](#subnet) | a box inside it is checked against the zone around it | security group | rules |
| <a id="sharedvpc"></a>**Shared VPC host project** `gcp:sharedvpc` | [Organization](#org), [Folder](#folder) |  | host project, xpn |  |
| <a id="perimeter"></a>**VPC Service Controls perimeter** `gcp:perimeter` | [Organization](#org), [Folder](#folder) | a box inside it is checked against the zone around it | service perimeter, vpc sc |  |

## Boxes

A box is one resource, such as a server, a database or a queue.

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="gce"></a>**Compute Engine VM** `gcp:gce` | [Subnet](#subnet), [Zone](#zone) | a box, or a zone when something runs inside it; can run [Container](container.md) inside | vm, server, instance | type; os |
| <a id="gke"></a>**GKE cluster** `gcp:gke` | [VPC network](#vpc), [Region](#region), [Subnet](#subnet) | a box, or a zone when something runs inside it; can run [Kubernetes](k8s.md) inside | kubernetes, k8s | mode (autopilot, standard) |
| <a id="cloudrun"></a>**Cloud Run** `gcp:cloudrun` | [Region](#region), [Project](#project), [Subnet](#subnet), [VPC network](#vpc) |  | container, serverless | cpu; memory |
| <a id="functions"></a>**Cloud Functions** `gcp:functions` | [Region](#region), [Project](#project), [Subnet](#subnet), [VPC network](#vpc) |  | function, serverless | runtime |
| <a id="loadbalancer"></a>**Load balancer** `gcp:loadbalancer` | [Project](#project), [VPC network](#vpc), [Region](#region) |  | lb | scheme (external, internal) |
| <a id="psc"></a>**Private Service Connect endpoint** `gcp:psc` | [Subnet](#subnet), [VPC network](#vpc) |  | private endpoint, private link |  |
| <a id="iap"></a>**Identity-Aware Proxy** `gcp:iap` | [Project](#project) |  | zero trust |  |
| <a id="apigee"></a>**Apigee** `gcp:apigee` | [Project](#project), [Region](#region) |  | api gateway |  |
| <a id="armor"></a>**Cloud Armor** `gcp:armor` | [Project](#project), [Region](#region) |  |  |  |
| <a id="cdn"></a>**Cloud CDN** `gcp:cdn` | [Project](#project) |  |  |  |
| <a id="dns"></a>**Cloud DNS** `gcp:dns` | [Project](#project) |  |  |  |
| <a id="nat"></a>**Cloud NAT** `gcp:nat` | [Region](#region), [VPC network](#vpc) |  |  |  |
| <a id="vpn"></a>**Cloud VPN** `gcp:vpn` | [Region](#region), [VPC network](#vpc) |  |  |  |
| <a id="interconnect"></a>**Cloud Interconnect** `gcp:interconnect` | [Region](#region), [Project](#project) |  |  |  |
| <a id="cloudsql"></a>**Cloud SQL** `gcp:cloudsql` | [Region](#region), [VPC network](#vpc), [Project](#project), [Subnet](#subnet) |  | db, database, postgres, mysql | engine (postgres, mysql, sqlserver); tier; ha (yes, no) |
| <a id="spanner"></a>**Spanner** `gcp:spanner` | [Region](#region), [Project](#project) |  |  |  |
| <a id="firestore"></a>**Firestore** `gcp:firestore` | [Region](#region), [Project](#project) |  |  |  |
| <a id="memorystore"></a>**Memorystore** `gcp:memorystore` | [VPC network](#vpc), [Region](#region), [Subnet](#subnet), [Project](#project) |  | redis, cache | engine (redis, valkey, memcached); size |
| <a id="alloydb"></a>**AlloyDB** `gcp:alloydb` | [VPC network](#vpc), [Region](#region), [Subnet](#subnet) |  | postgres, db |  |
| <a id="filestore"></a>**Filestore** `gcp:filestore` | [VPC network](#vpc), [Region](#region), [Zone](#zone) |  | nfs, file share |  |
| <a id="bigquery"></a>**BigQuery** `gcp:bigquery` | [Region](#region), [Project](#project) |  |  |  |
| <a id="gcs"></a>**Cloud Storage bucket** `gcp:gcs` | [Region](#region), [Project](#project) |  | bucket, object storage | class (standard, nearline, coldline, archive) |
| <a id="pubsub"></a>**Pub/Sub topic** `gcp:pubsub` | [Project](#project), [Region](#region) |  | queue, topic |  |
| <a id="dataflow"></a>**Dataflow** `gcp:dataflow` | [Region](#region), [Project](#project) |  |  |  |
| <a id="composer"></a>**Managed Airflow (Composer)** `gcp:composer` | [Region](#region), [Project](#project) |  | airflow, dag |  |
| <a id="scheduler"></a>**Cloud Scheduler** `gcp:scheduler` | [Region](#region), [Project](#project) |  |  | schedule |
| <a id="cloudtasks"></a>**Cloud Tasks** `gcp:cloudtasks` | [Region](#region), [Project](#project) |  | queue |  |
| <a id="cloudbuild"></a>**Cloud Build** `gcp:cloudbuild` | [Region](#region), [Project](#project) |  | ci |  |
| <a id="secretmanager"></a>**Secret Manager** `gcp:secretmanager` | [Project](#project) |  | secret |  |
| <a id="kms"></a>**Cloud KMS** `gcp:kms` | [Region](#region), [Project](#project) |  |  |  |
| <a id="iam"></a>**Service account** `gcp:iam` | [Project](#project) |  | role, permission |  |
| <a id="logging"></a>**Cloud Logging** `gcp:logging` | [Project](#project) |  |  |  |
| <a id="monitoring"></a>**Cloud Monitoring** `gcp:monitoring` | [Project](#project) |  |  |  |
| <a id="artifactregistry"></a>**Artifact Registry** `gcp:artifactregistry` | [Region](#region), [Project](#project) |  | registry, image |  |
| <a id="vertexai"></a>**Vertex AI / Agent Platform** `gcp:vertexai` | [Region](#region), [Project](#project) |  | gemini, ml, llm, agent |  |
| <a id="mig"></a>**Managed instance group** `gcp:mig` | [Subnet](#subnet), [Zone](#zone), [Region](#region) | a box, or a zone when something runs inside it; can run [Container](container.md) inside | autoscaling, instance group, vm | min; max; type |
| <a id="disk"></a>**Persistent Disk / Hyperdisk** `gcp:disk` | [Zone](#zone), [Region](#region), [Subnet](#subnet) |  | disk, volume, block storage | size; type |
| <a id="appengine"></a>**App Engine** `gcp:appengine` | [Region](#region), [Project](#project) |  | paas, web app |  |
| <a id="batch"></a>**Batch** `gcp:batch` | [Region](#region), [Project](#project), [Subnet](#subnet) |  | batch job, hpc |  |
| <a id="vmwareengine"></a>**VMware Engine** `gcp:vmwareengine` | [Region](#region), [VPC network](#vpc), [Project](#project) | a box, or a zone when something runs inside it | vmware, vsphere |  |
| <a id="apigateway"></a>**API Gateway** `gcp:apigateway` | [Region](#region), [Project](#project) |  | api |  |
| <a id="eventarc"></a>**Eventarc trigger** `gcp:eventarc` | [Region](#region), [Project](#project) |  | event, trigger |  |
| <a id="workflows"></a>**Workflows** `gcp:workflows` | [Region](#region), [Project](#project) |  | orchestration, workflow |  |
| <a id="clouddeploy"></a>**Cloud Deploy** `gcp:clouddeploy` | [Region](#region), [Project](#project) |  | cd, delivery |  |
| <a id="sourcemanager"></a>**Secure Source Manager** `gcp:sourcemanager` | [Region](#region), [Project](#project) |  | git, repo |  |
| <a id="router"></a>**Cloud Router** `gcp:router` | [Region](#region), [VPC network](#vpc) |  | bgp |  |
| <a id="ncc"></a>**Network Connectivity Center** `gcp:ncc` | [Project](#project), [Organization](#org) |  | hub, transit |  |
| <a id="ngfw"></a>**Cloud NGFW policy** `gcp:ngfw` | [VPC network](#vpc), [Project](#project), [Organization](#org), [Folder](#folder) |  | firewall policy, next generation firewall |  |
| <a id="ids"></a>**Cloud IDS** `gcp:ids` | [VPC network](#vpc), [Region](#region) |  | intrusion detection |  |
| <a id="swp"></a>**Secure Web Proxy** `gcp:swp` | [VPC network](#vpc), [Region](#region), [Subnet](#subnet) |  | egress proxy, proxy |  |
| <a id="servicemesh"></a>**Cloud Service Mesh** `gcp:servicemesh` | [Project](#project), [VPC network](#vpc) |  | istio, mesh |  |
| <a id="bigtable"></a>**Bigtable** `gcp:bigtable` | [Region](#region), [Project](#project), [Zone](#zone) |  | nosql, wide column, hbase | nodes |
| <a id="datastream"></a>**Datastream** `gcp:datastream` | [Region](#region), [Project](#project) |  | cdc, change data capture, replication |  |
| <a id="dms"></a>**Database Migration Service** `gcp:dms` | [Region](#region), [Project](#project) |  | migration |  |
| <a id="kafka"></a>**Managed Service for Apache Kafka** `gcp:kafka` | [Region](#region), [VPC network](#vpc), [Subnet](#subnet) |  | kafka, stream |  |
| <a id="dataproc"></a>**Managed Service for Apache Spark (Dataproc)** `gcp:dataproc` | [Region](#region), [Subnet](#subnet), [Project](#project) |  | spark, hadoop, dataproc |  |
| <a id="datafusion"></a>**Cloud Data Fusion** `gcp:datafusion` | [Region](#region), [Project](#project) |  | etl, pipeline |  |
| <a id="dataform"></a>**Dataform** `gcp:dataform` | [Region](#region), [Project](#project) |  | elt, sql workflow |  |
| <a id="looker"></a>**Looker** `gcp:looker` | [Region](#region), [Project](#project) |  | bi, dashboard, report |  |
| <a id="netappvolumes"></a>**NetApp Volumes** `gcp:netappvolumes` | [Region](#region), [VPC network](#vpc) |  | nfs, smb, file share |  |
| <a id="backupdr"></a>**Backup and DR** `gcp:backupdr` | [Region](#region), [Project](#project) |  | backup, disaster recovery |  |
| <a id="certificatemanager"></a>**Certificate Manager** `gcp:certificatemanager` | [Project](#project), [Region](#region) |  | tls, ssl, certificate |  |
| <a id="identityplatform"></a>**Identity Platform** `gcp:identityplatform` | [Project](#project) |  | login, auth, customer identity |  |
| <a id="managedad"></a>**Managed Microsoft AD** `gcp:managedad` | [VPC network](#vpc), [Project](#project) |  | active directory, ad, ldap |  |
| <a id="scc"></a>**Security Command Center** `gcp:scc` | [Organization](#org), [Project](#project) |  | security, posture |  |
| <a id="trace"></a>**Cloud Trace** `gcp:trace` | [Project](#project) |  | tracing, latency |  |
| <a id="documentai"></a>**Document AI** `gcp:documentai` | [Region](#region), [Project](#project) |  | ocr, document |  |

## Lines

A line without a kind is plain traffic, one part calling another. These kinds are for lines that mean something else.

| Kind | Means |
|---|---|
| <a id="line-event"></a>`gcp:event` | Event or message |
| <a id="line-peering"></a>`gcp:peering` | VPC peering |
| <a id="line-iam"></a>`gcp:iam` | Permission (IAM) |
| <a id="line-replication"></a>`gcp:replication` | Replication |

> **Good to know:** This page is generated from `skills/walkboard/lib/profiles.mjs`. To add a kind, change that file and run `node scripts/profiles-doc.mjs`.
