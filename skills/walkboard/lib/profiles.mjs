// Profiles: what the boxes, zones and lines of a map mean on one platform. A map takes none, one or several: a box, a
// zone or a line with `kind: "aws:rds"` belongs to the aws profile; one without a kind is drawn as the user likes.
// Runs in Node and in the browser: no imports. A new profile is one more entry in PROFILES (see AGENTS.md).
//
// kinds.<key>:
//   name   what it is called (the page and the agent's words); short: the word on a box or a zone's tag
//   zone   true: only a zone (it holds things); "also": a box, or a zone when it holds something; absent: a box
//   icon   its icon (lib/icons.mjs) unless the box picks another
//   in     the kinds it usually sits in. The page warns, never blocks, when the nearest zone with a kind is another one;
//          a zone without a kind says nothing, so drawing freely never warns. Absent: anywhere.
//   see    a zone that rules look through (a security group: what is in it sits in the subnet around it)
//   runs   profiles whose kinds a zone of this kind holds without a warning (an EC2 runs containers, EKS Kubernetes)
//   also   everyday words the card's search finds it by
//   props  fields of its card: "" free text, a list: one of these
// lines.<key>: kinds of line besides plain traffic ({name, style}); style is a class the page draws.
export const PROFILES = {
  aws: {
    label: "AWS",
    family: "aws",
    kinds: {
      account: {name: "Account", zone: true, icon: "aws:organizations"},
      region: {name: "Region", zone: true, icon: "cloud", in: ["account"]},
      vpc: {name: "VPC", zone: true, icon: "aws:vpc", in: ["account", "region"], props: {cidr: ""}},
      az: {name: "Availability Zone", short: "AZ", zone: true, icon: "datacenter", in: ["vpc", "region"]},
      subnet: {name: "Subnet", zone: true, icon: "network", in: ["vpc", "az"], props: {access: ["private", "public"], cidr: ""}},
      sg: {name: "Security group", also: ["security group", "firewall"], zone: true, see: true, icon: "aws:securitygroup", in: ["vpc", "subnet", "az"], props: {rules: ""}},
      ec2: {name: "EC2", also: ["vm", "server", "instance"], zone: "also", icon: "aws:ec2", runs: ["container"], in: ["subnet"], props: {type: "", os: ""}},
      ecs: {name: "ECS cluster", also: ["container"], zone: "also", icon: "aws:ecs", runs: ["container"], in: ["vpc", "subnet", "region"]},
      fargate: {name: "Fargate task", also: ["container", "task"], icon: "aws:fargate", in: ["ecs", "subnet"], props: {cpu: "", memory: ""}},
      eks: {name: "EKS cluster", also: ["kubernetes", "k8s"], zone: "also", icon: "aws:eks", runs: ["k8s"], in: ["vpc", "region"], props: {version: ""}},
      lambda: {name: "Lambda", also: ["function", "serverless"], icon: "aws:lambda", in: ["region", "account", "vpc", "subnet"], props: {runtime: ""}},
      alb: {name: "Application Load Balancer", short: "ALB", also: ["lb", "load balancer"], icon: "aws:alb", in: ["subnet", "vpc"], props: {scheme: ["internet-facing", "internal"]}},
      nlb: {name: "Network Load Balancer", short: "NLB", also: ["lb", "load balancer"], icon: "aws:nlb", in: ["subnet", "vpc"], props: {scheme: ["internet-facing", "internal"]}},
      internetgateway: {name: "Internet Gateway", also: ["igw"], icon: "aws:internetgateway", in: ["vpc"]},
      natgateway: {name: "NAT Gateway", also: ["nat"], icon: "aws:natgateway", in: ["subnet"]},
      endpoint: {name: "VPC endpoint", also: ["privatelink", "private link"], icon: "aws:endpoint", in: ["vpc", "subnet"], props: {service: ""}},
      transitgateway: {name: "Transit Gateway", icon: "aws:transitgateway", in: ["region", "account"]},
      vpn: {name: "Site-to-Site VPN", short: "VPN", icon: "aws:vpn", in: ["vpc", "region"]},
      directconnect: {name: "Direct Connect", icon: "aws:directconnect", in: ["region", "account"], props: {bandwidth: ""}},
      apigateway: {name: "API Gateway", also: ["api"], icon: "aws:apigateway", in: ["region", "account"], props: {type: ["REST", "HTTP", "WebSocket"]}},
      cloudfront: {name: "CloudFront", also: ["cdn"], icon: "aws:cloudfront", in: ["account"]},
      route53: {name: "Route 53", also: ["dns"], icon: "aws:route53", in: ["account"]},
      waf: {name: "WAF", icon: "aws:waf", in: ["account", "region"]},
      rds: {name: "RDS", also: ["db", "database", "postgres", "mysql"], icon: "aws:rds", in: ["subnet", "vpc"], props: {engine: ["postgres", "mysql", "mariadb", "oracle", "sqlserver"], size: "", multiAz: ["yes", "no"]}},
      aurora: {name: "Aurora", also: ["db", "database", "postgres", "mysql"], icon: "aws:aurora", in: ["subnet", "vpc"], props: {engine: ["postgres", "mysql"], size: "", serverless: ["yes", "no"]}},
      dynamodb: {name: "DynamoDB", also: ["db", "nosql", "table"], icon: "aws:dynamodb", in: ["region", "account"], props: {capacity: ["on-demand", "provisioned"]}},
      elasticache: {name: "ElastiCache", also: ["redis", "cache", "valkey"], icon: "aws:elasticache", in: ["subnet", "vpc"], props: {engine: ["redis", "valkey", "memcached"], size: ""}},
      redshift: {name: "Redshift", icon: "aws:redshift", in: ["subnet", "vpc"]},
      s3: {name: "S3 bucket", also: ["bucket", "object storage"], icon: "aws:s3", in: ["region", "account"], props: {versioning: ["on", "off"]}},
      efs: {name: "EFS", also: ["nfs", "file share"], icon: "aws:efs", in: ["vpc", "subnet"]},
      sqs: {name: "SQS queue", also: ["queue"], icon: "aws:sqs", in: ["region", "account"], props: {type: ["standard", "fifo"]}},
      sns: {name: "SNS topic", also: ["topic", "notification"], icon: "aws:sns", in: ["region", "account"]},
      eventbridge: {name: "EventBridge", icon: "aws:eventbridge", in: ["region", "account"]},
      kinesis: {name: "Kinesis", also: ["stream"], icon: "aws:kinesis", in: ["region", "account"]},
      msk: {name: "MSK (Kafka)", also: ["kafka", "stream"], icon: "aws:msk", in: ["vpc", "subnet"]},
      stepfunctions: {name: "Step Functions", icon: "aws:stepfunctions", in: ["region", "account"]},
      secretsmanager: {name: "Secrets Manager", also: ["secret", "password"], icon: "aws:secretsmanager", in: ["region", "account"]},
      kms: {name: "KMS key", icon: "aws:kms", in: ["region", "account"]},
      iam: {name: "IAM role", also: ["role", "permission"], icon: "aws:iam", in: ["account"]},
      cognito: {name: "Cognito", also: ["login", "auth"], icon: "aws:cognito", in: ["region", "account"]},
      cloudwatch: {name: "CloudWatch", also: ["logs", "monitor", "alarm"], icon: "aws:cloudwatch", in: ["region", "account"]},
      ecr: {name: "ECR", also: ["registry", "image"], icon: "aws:ecr", in: ["region", "account"]},
      ses: {name: "SES", icon: "aws:ses", in: ["region", "account"]},
      athena: {name: "Athena", icon: "aws:athena", in: ["region", "account"]},
      glue: {name: "Glue", icon: "aws:glue", in: ["region", "account"]},
      bedrock: {name: "Bedrock", icon: "aws:bedrock", in: ["region", "account"]},
      codepipeline: {name: "CodePipeline", icon: "aws:codepipeline", in: ["region", "account"]},
    },
    lines: {
      event: {name: "Event or message", style: "event"},
      peering: {name: "VPC peering", style: "peering"},
      iam: {name: "Permission (IAM)", style: "permission"},
      replication: {name: "Replication", style: "replication"},
    },
  },
};

// Google Cloud, Azure and Huawei Cloud, laid out as AWS is: where things run, what holds them, how they connect.
PROFILES.gcp = {
  label: "Google Cloud",
  family: "gcp",
  kinds: {
    org: {name: "Organization", zone: true, icon: "gcp:users"},
    folder: {name: "Folder", zone: true, icon: "gcp:folder", in: ["org", "folder"]},
    project: {name: "Project", zone: true, icon: "gcp:folder", in: ["org", "folder", "sharedvpc", "perimeter"]},
    vpc: {name: "VPC network", zone: true, icon: "gcp:vpc", in: ["project"]},
    region: {name: "Region", zone: true, icon: "gcp:cloud", in: ["project", "vpc"]},
    zone: {name: "Zone", zone: true, icon: "gcp:datacenter", in: ["region"]},
    subnet: {name: "Subnet", zone: true, icon: "gcp:network", in: ["vpc", "region"], props: {cidr: ""}},
    firewall: {name: "Firewall rule", also: ["security group"], zone: true, see: true, icon: "gcp:firewall", in: ["vpc", "subnet"], props: {rules: ""}},
    gce: {name: "Compute Engine VM", short: "GCE VM", also: ["vm", "server", "instance"], zone: "also", icon: "gcp:vm", runs: ["container"], in: ["subnet", "zone"], props: {type: "", os: ""}},
    gke: {name: "GKE cluster", also: ["kubernetes", "k8s"], zone: "also", icon: "gcp:gke", runs: ["k8s"], in: ["vpc", "region", "subnet"], props: {mode: ["autopilot", "standard"]}},
    cloudrun: {name: "Cloud Run", also: ["container", "serverless"], icon: "gcp:cloudrun", in: ["region", "project", "subnet", "vpc"], props: {cpu: "", memory: ""}},
    functions: {name: "Cloud Functions", also: ["function", "serverless"], icon: "gcp:functions", in: ["region", "project", "subnet", "vpc"], props: {runtime: ""}},
    loadbalancer: {name: "Load balancer", also: ["lb"], icon: "gcp:loadbalancing", in: ["project", "vpc", "region"], props: {scheme: ["external", "internal"]}},
    psc: {name: "Private Service Connect endpoint", short: "PSC endpoint", also: ["private endpoint", "private link"], icon: "gcp:plug", in: ["subnet", "vpc"]},
    iap: {name: "Identity-Aware Proxy", short: "IAP", also: ["zero trust"], icon: "gcp:shield", in: ["project"]},
    apigee: {name: "Apigee", also: ["api gateway"], icon: "gcp:gateway", in: ["project", "region"]},
    armor: {name: "Cloud Armor", icon: "gcp:cloudarmor", in: ["project", "region"]},
    cdn: {name: "Cloud CDN", icon: "gcp:cdn", in: ["project"]},
    dns: {name: "Cloud DNS", icon: "gcp:dns", in: ["project"]},
    nat: {name: "Cloud NAT", icon: "gcp:gateway", in: ["region", "vpc"]},
    vpn: {name: "Cloud VPN", icon: "gcp:vpn", in: ["region", "vpc"]},
    interconnect: {name: "Cloud Interconnect", icon: "gcp:interconnect", in: ["region", "project"]},
    cloudsql: {name: "Cloud SQL", also: ["db", "database", "postgres", "mysql"], icon: "gcp:cloudsql", in: ["region", "vpc", "project", "subnet"], props: {engine: ["postgres", "mysql", "sqlserver"], tier: "", ha: ["yes", "no"]}},
    spanner: {name: "Spanner", icon: "gcp:spanner", in: ["region", "project"]},
    firestore: {name: "Firestore", icon: "gcp:firestore", in: ["region", "project"]},
    memorystore: {name: "Memorystore", also: ["redis", "cache"], icon: "gcp:memorystore", in: ["vpc", "region", "subnet", "project"], props: {engine: ["redis", "valkey", "memcached"], size: ""}},
    alloydb: {name: "AlloyDB", also: ["postgres", "db"], icon: "gcp:database", in: ["vpc", "region", "subnet"]},
    filestore: {name: "Filestore", also: ["nfs", "file share"], icon: "gcp:folder", in: ["vpc", "region", "zone"]},
    bigquery: {name: "BigQuery", icon: "gcp:bigquery", in: ["region", "project"]},
    gcs: {name: "Cloud Storage bucket", short: "GCS bucket", also: ["bucket", "object storage"], icon: "gcp:gcs", in: ["region", "project"], props: {class: ["standard", "nearline", "coldline", "archive"]}},
    pubsub: {name: "Pub/Sub topic", also: ["queue", "topic"], icon: "gcp:pubsub", in: ["project", "region"]},
    dataflow: {name: "Dataflow", icon: "gcp:dataflow", in: ["region", "project"]},
    composer: {name: "Managed Airflow (Composer)", short: "Composer", also: ["airflow", "dag"], icon: "gcp:composer", in: ["region", "project"]},
    scheduler: {name: "Cloud Scheduler", icon: "gcp:scheduler", in: ["region", "project"], props: {schedule: ""}},
    cloudtasks: {name: "Cloud Tasks", also: ["queue"], icon: "gcp:queue", in: ["region", "project"]},
    cloudbuild: {name: "Cloud Build", also: ["ci"], icon: "gcp:ci", in: ["region", "project"]},
    secretmanager: {name: "Secret Manager", also: ["secret"], icon: "gcp:secretmanager", in: ["project"]},
    kms: {name: "Cloud KMS", icon: "gcp:kms", in: ["region", "project"]},
    iam: {name: "Service account", also: ["role", "permission"], icon: "gcp:iam", in: ["project"]},
    logging: {name: "Cloud Logging", icon: "gcp:logging", in: ["project"]},
    monitoring: {name: "Cloud Monitoring", icon: "gcp:monitoring", in: ["project"]},
    artifactregistry: {name: "Artifact Registry", also: ["registry", "image"], icon: "gcp:artifactregistry", in: ["region", "project"]},
    vertexai: {name: "Vertex AI / Agent Platform", short: "Vertex AI", also: ["gemini", "ml", "llm", "agent"], icon: "gcp:vertexai", in: ["region", "project"]},
    sharedvpc: {name: "Shared VPC host project", short: "Shared VPC", also: ["host project", "xpn"], zone: true, icon: "gcp:network", in: ["org", "folder"]},
    perimeter: {name: "VPC Service Controls perimeter", short: "VPC SC perimeter", also: ["service perimeter", "vpc sc"], zone: true, see: true, icon: "gcp:shield", in: ["org", "folder"]},
    mig: {name: "Managed instance group", short: "MIG", also: ["autoscaling", "instance group", "vm"], zone: "also", icon: "gcp:vm", runs: ["container"], in: ["subnet", "zone", "region"], props: {min: "", max: "", type: ""}},
    disk: {name: "Persistent Disk / Hyperdisk", short: "Disk", also: ["disk", "volume", "block storage"], icon: "gcp:nas", in: ["zone", "region", "subnet"], props: {size: "", type: ""}},
    appengine: {name: "App Engine", also: ["paas", "web app"], icon: "gcp:server", in: ["region", "project"]},
    batch: {name: "Batch", also: ["batch job", "hpc"], icon: "gcp:job", in: ["region", "project", "subnet"]},
    vmwareengine: {name: "VMware Engine", also: ["vmware", "vsphere"], zone: "also", icon: "gcp:vm", in: ["region", "vpc", "project"]},
    apigateway: {name: "API Gateway", also: ["api"], icon: "gcp:gateway", in: ["region", "project"]},
    eventarc: {name: "Eventarc trigger", short: "Eventarc", also: ["event", "trigger"], icon: "gcp:topic", in: ["region", "project"]},
    workflows: {name: "Workflows", also: ["orchestration", "workflow"], icon: "gcp:workflow", in: ["region", "project"]},
    clouddeploy: {name: "Cloud Deploy", also: ["cd", "delivery"], icon: "gcp:ci", in: ["region", "project"]},
    sourcemanager: {name: "Secure Source Manager", also: ["git", "repo"], icon: "gcp:git", in: ["region", "project"]},
    router: {name: "Cloud Router", also: ["bgp"], icon: "gcp:network", in: ["region", "vpc"]},
    ncc: {name: "Network Connectivity Center", short: "NCC hub", also: ["hub", "transit"], icon: "gcp:ncc", in: ["project", "org"]},
    ngfw: {name: "Cloud NGFW policy", short: "Cloud NGFW", also: ["firewall policy", "next generation firewall"], icon: "gcp:firewall", in: ["vpc", "project", "org", "folder"]},
    ids: {name: "Cloud IDS", also: ["intrusion detection"], icon: "gcp:shield", in: ["vpc", "region"]},
    swp: {name: "Secure Web Proxy", also: ["egress proxy", "proxy"], icon: "gcp:gateway", in: ["vpc", "region", "subnet"]},
    servicemesh: {name: "Cloud Service Mesh", also: ["istio", "mesh"], icon: "gcp:network", in: ["project", "vpc"]},
    bigtable: {name: "Bigtable", also: ["nosql", "wide column", "hbase"], icon: "gcp:table", in: ["region", "project", "zone"], props: {nodes: ""}},
    datastream: {name: "Datastream", also: ["cdc", "change data capture", "replication"], icon: "gcp:stream", in: ["region", "project"]},
    dms: {name: "Database Migration Service", also: ["migration"], icon: "gcp:database", in: ["region", "project"]},
    kafka: {name: "Managed Service for Apache Kafka", short: "Kafka", also: ["kafka", "stream"], icon: "gcp:stream", in: ["region", "vpc", "subnet"]},
    dataproc: {name: "Managed Service for Apache Spark (Dataproc)", short: "Dataproc", also: ["spark", "hadoop", "dataproc"], icon: "gcp:stream", in: ["region", "subnet", "project"]},
    datafusion: {name: "Cloud Data Fusion", also: ["etl", "pipeline"], icon: "gcp:workflow", in: ["region", "project"]},
    dataform: {name: "Dataform", also: ["elt", "sql workflow"], icon: "gcp:workflow", in: ["region", "project"]},
    looker: {name: "Looker", also: ["bi", "dashboard", "report"], icon: "gcp:monitor", in: ["region", "project"]},
    netappvolumes: {name: "NetApp Volumes", also: ["nfs", "smb", "file share"], icon: "gcp:folder", in: ["region", "vpc"]},
    backupdr: {name: "Backup and DR", also: ["backup", "disaster recovery"], icon: "gcp:nas", in: ["region", "project"]},
    certificatemanager: {name: "Certificate Manager", also: ["tls", "ssl", "certificate"], icon: "gcp:key", in: ["project", "region"]},
    identityplatform: {name: "Identity Platform", also: ["login", "auth", "customer identity"], icon: "gcp:login", in: ["project"]},
    managedad: {name: "Managed Microsoft AD", also: ["active directory", "ad", "ldap"], icon: "gcp:identity", in: ["vpc", "project"]},
    scc: {name: "Security Command Center", also: ["security", "posture"], icon: "gcp:shield", in: ["org", "project"]},
    trace: {name: "Cloud Trace", also: ["tracing", "latency"], icon: "gcp:monitor", in: ["project"]},
    documentai: {name: "Document AI", also: ["ocr", "document"], icon: "gcp:file", in: ["region", "project"]},
  },
  lines: {
    event: {name: "Event or message", style: "event"},
    peering: {name: "VPC peering", style: "peering"},
    iam: {name: "Permission (IAM)", style: "permission"},
    replication: {name: "Replication", style: "replication"},
  },
};

PROFILES.azure = {
  label: "Azure",
  family: "azure",
  kinds: {
    subscription: {name: "Subscription", zone: true, icon: "azure:key", in: ["managementgroup"]},
    managementgroup: {name: "Management group", zone: true, icon: "azure:users", in: ["managementgroup"]},
    resourcegroup: {name: "Resource group", zone: true, icon: "azure:folder", in: ["subscription"]},
    region: {name: "Region", zone: true, icon: "azure:cloud", in: ["subscription", "resourcegroup"]},
    vnet: {name: "Virtual network", short: "VNet", zone: true, icon: "azure:vnet", in: ["resourcegroup", "region", "subscription"], props: {cidr: ""}},
    availabilityzone: {name: "Availability Zone", short: "AZ", zone: true, icon: "azure:datacenter", in: ["region", "vnet"]},
    subnet: {name: "Subnet", zone: true, icon: "azure:network", in: ["vnet"], props: {cidr: ""}},
    nsg: {name: "Network security group", short: "NSG", also: ["security group", "firewall"], zone: true, see: true, icon: "azure:shield", in: ["vnet", "subnet"], props: {rules: ""}},
    vm: {name: "Virtual machine", short: "VM", also: ["server", "instance"], zone: "also", icon: "azure:vm", runs: ["container"], in: ["subnet"], props: {size: "", os: ""}},
    aks: {name: "AKS cluster", also: ["kubernetes", "k8s"], zone: "also", icon: "azure:aks", runs: ["k8s"], in: ["vnet", "subnet", "resourcegroup"]},
    appservice: {name: "App Service", also: ["web app"], icon: "azure:appservice", in: ["resourcegroup", "region", "subnet"], props: {plan: ""}},
    functions: {name: "Functions", also: ["function", "serverless"], icon: "azure:functions", in: ["resourcegroup", "region"], props: {runtime: ""}},
    containerapps: {name: "Container Apps", also: ["container"], icon: "azure:container", in: ["resourcegroup", "region", "subnet"]},
    aci: {name: "Container Instances", also: ["container"], icon: "azure:container", in: ["resourcegroup", "subnet"]},
    logicapps: {name: "Logic Apps", also: ["workflow"], icon: "azure:workflow", in: ["resourcegroup", "region"]},
    appgateway: {name: "Application Gateway", icon: "azure:appgateway", in: ["subnet", "vnet"]},
    loadbalancer: {name: "Load Balancer", also: ["lb"], icon: "azure:loadbalancer", in: ["subnet", "vnet", "resourcegroup"], props: {scheme: ["public", "internal"]}},
    frontdoor: {name: "Front Door", icon: "azure:frontdoor", in: ["subscription", "resourcegroup"]},
    firewall: {name: "Azure Firewall", icon: "azure:firewall", in: ["subnet", "vnet"]},
    privateendpoint: {name: "Private endpoint", also: ["private link"], icon: "azure:plug", in: ["subnet"]},
    privatednszone: {name: "Private DNS zone", also: ["dns"], icon: "azure:dns", in: ["resourcegroup", "vnet"]},
    bastion: {name: "Bastion", also: ["jump host"], icon: "azure:terminal", in: ["subnet", "vnet"]},
    natgateway: {name: "NAT Gateway", also: ["nat"], icon: "azure:gateway", in: ["subnet", "vnet"]},
    vpngateway: {name: "VPN Gateway", icon: "azure:vpngateway", in: ["subnet", "vnet"]},
    expressroute: {name: "ExpressRoute", icon: "azure:expressroute", in: ["resourcegroup", "region", "subscription"]},
    apim: {name: "API Management", icon: "azure:apim", in: ["resourcegroup", "subnet"]},
    sql: {name: "Azure SQL", also: ["db", "database", "sql server"], icon: "azure:sql", in: ["resourcegroup", "region", "subnet", "vnet"], props: {tier: ""}},
    postgres: {name: "Database for PostgreSQL", short: "PostgreSQL", also: ["db", "database"], icon: "azure:database", in: ["resourcegroup", "subnet", "region"], props: {tier: ""}},
    cosmosdb: {name: "Cosmos DB", also: ["db", "nosql", "mongodb"], icon: "azure:cosmosdb", in: ["resourcegroup", "region", "subnet", "vnet"], props: {api: ["nosql", "mongodb", "cassandra", "gremlin", "table"]}},
    redis: {name: "Azure Managed Redis", short: "Redis", also: ["cache", "azure cache for redis"], icon: "azure:cache", in: ["resourcegroup", "subnet", "region"], props: {tier: ""}},
    storage: {name: "Storage account", also: ["blob", "bucket", "object storage"], icon: "azure:storage", in: ["resourcegroup", "region", "subnet", "vnet"], props: {kind: ["blob", "files", "queue", "table"]}},
    servicebus: {name: "Service Bus", also: ["queue"], icon: "azure:servicebus", in: ["resourcegroup", "region", "subnet", "vnet"]},
    eventhubs: {name: "Event Hubs", icon: "azure:eventhubs", in: ["resourcegroup", "region", "subnet", "vnet"]},
    eventgrid: {name: "Event Grid", icon: "azure:eventgrid", in: ["resourcegroup", "region"]},
    keyvault: {name: "Key Vault", also: ["secret", "key"], icon: "azure:keyvault", in: ["resourcegroup", "region", "subnet", "vnet"]},
    entra: {name: "Entra ID", also: ["login", "identity", "ad"], icon: "azure:entra", in: ["subscription"]},
    managedidentity: {name: "Managed identity", also: ["identity"], icon: "azure:identity", in: ["resourcegroup", "subscription"]},
    monitor: {name: "Azure Monitor", icon: "azure:monitor", in: ["subscription", "resourcegroup"]},
    acr: {name: "Container Registry", also: ["registry", "image"], icon: "azure:acr", in: ["resourcegroup", "region", "subnet", "vnet"]},
    openai: {name: "Azure OpenAI / Foundry", short: "Azure OpenAI", also: ["foundry", "gpt", "llm", "ai"], icon: "azure:openai", in: ["resourcegroup", "region"]},
    vmss: {name: "VM scale set", short: "VMSS", also: ["autoscaling", "scale set", "vm"], zone: "also", icon: "azure:vm", runs: ["container"], in: ["subnet"], props: {min: "", max: "", size: ""}},
    disk: {name: "Managed disk", short: "Disk", also: ["disk", "volume", "block storage"], icon: "azure:nas", in: ["resourcegroup", "region", "availabilityzone"], props: {size: "", sku: ""}},
    aro: {name: "Azure Red Hat OpenShift", short: "ARO", also: ["openshift", "kubernetes"], zone: "also", icon: "azure:cluster", runs: ["k8s"], in: ["vnet", "subnet", "resourcegroup"]},
    staticwebapps: {name: "Static Web Apps", also: ["static site", "frontend", "spa"], icon: "azure:browser", in: ["resourcegroup", "region"]},
    batch: {name: "Batch", also: ["batch job", "hpc"], icon: "azure:job", in: ["resourcegroup", "subnet"]},
    avd: {name: "Azure Virtual Desktop", short: "AVD", also: ["vdi", "desktop"], icon: "azure:vm", in: ["resourcegroup", "subnet", "vnet"]},
    vmware: {name: "Azure VMware Solution", short: "AVS", also: ["vmware", "vsphere"], zone: "also", icon: "azure:vm", in: ["resourcegroup", "region"]},
    appconfig: {name: "App Configuration", also: ["config", "feature flags"], icon: "azure:config", in: ["resourcegroup", "region", "subnet"]},
    sqlmi: {name: "SQL Managed Instance", short: "SQL MI", also: ["sql server", "db", "database"], icon: "azure:sql", in: ["subnet", "vnet"], props: {tier: ""}},
    mysql: {name: "Database for MySQL", short: "MySQL", also: ["db", "database"], icon: "azure:database", in: ["resourcegroup", "subnet", "region"], props: {tier: ""}},
    documentdb: {name: "Azure DocumentDB (MongoDB)", short: "DocumentDB", also: ["mongodb", "document"], icon: "azure:table", in: ["resourcegroup", "region", "subnet", "vnet"]},
    files: {name: "Azure Files share", short: "Azure Files", also: ["smb", "nfs", "file share"], icon: "azure:folder", in: ["resourcegroup", "region", "subnet", "vnet"]},
    netappfiles: {name: "Azure NetApp Files", also: ["nfs", "smb", "file share"], icon: "azure:folder", in: ["subnet", "vnet"]},
    datalake: {name: "Data Lake Storage", also: ["adls", "data lake"], icon: "azure:bucket", in: ["resourcegroup", "region", "subnet", "vnet"]},
    datafactory: {name: "Data Factory", short: "ADF", also: ["etl", "pipeline"], icon: "azure:workflow", in: ["resourcegroup", "region"]},
    synapse: {name: "Synapse Analytics", also: ["warehouse", "analytics"], icon: "azure:warehouse", in: ["resourcegroup", "region"]},
    databricks: {name: "Azure Databricks", also: ["spark", "lakehouse"], icon: "azure:warehouse", in: ["resourcegroup", "vnet"]},
    fabric: {name: "Microsoft Fabric", also: ["lakehouse", "warehouse", "onelake"], icon: "azure:warehouse", in: ["subscription", "resourcegroup"]},
    streamanalytics: {name: "Stream Analytics", also: ["stream", "real-time"], icon: "azure:stream", in: ["resourcegroup", "region"]},
    dataexplorer: {name: "Data Explorer", short: "ADX", also: ["kusto", "logs analytics"], icon: "azure:search", in: ["resourcegroup", "region", "subnet"]},
    powerbi: {name: "Power BI", also: ["bi", "dashboard", "report"], icon: "azure:monitor", in: ["subscription"]},
    signalr: {name: "SignalR Service", also: ["websocket", "real-time"], icon: "azure:chat", in: ["resourcegroup", "region"]},
    webpubsub: {name: "Web PubSub", also: ["websocket", "pubsub"], icon: "azure:chat", in: ["resourcegroup", "region"]},
    notificationhubs: {name: "Notification Hubs", also: ["push", "notification"], icon: "azure:chat", in: ["resourcegroup", "region"]},
    communication: {name: "Communication Services", also: ["sms", "email", "voice"], icon: "azure:email", in: ["resourcegroup", "region"]},
    iothub: {name: "IoT Hub", also: ["iot", "device"], icon: "azure:topic", in: ["resourcegroup", "region"]},
    dns: {name: "Azure DNS zone", short: "DNS", also: ["dns"], icon: "azure:dns", in: ["resourcegroup", "subscription"]},
    trafficmanager: {name: "Traffic Manager", also: ["dns load balancing", "failover"], icon: "azure:dns", in: ["resourcegroup", "subscription"]},
    waf: {name: "Web Application Firewall policy", short: "WAF", also: ["waf"], icon: "azure:firewall", in: ["resourcegroup", "subscription"]},
    ddos: {name: "DDoS Protection plan", short: "DDoS Protection", also: ["ddos"], icon: "azure:shield", in: ["resourcegroup", "subscription", "vnet"]},
    vwan: {name: "Virtual WAN hub", short: "vWAN hub", also: ["hub", "transit", "virtual wan"], zone: "also", icon: "azure:vwan", in: ["resourcegroup", "region", "subscription"]},
    routeserver: {name: "Route Server", also: ["bgp"], icon: "azure:network", in: ["subnet", "vnet"]},
    privatelinkservice: {name: "Private Link service", also: ["private link"], icon: "azure:plug", in: ["subnet", "vnet"]},
    loganalytics: {name: "Log Analytics workspace", short: "Log Analytics", also: ["logs", "kql"], icon: "azure:log", in: ["resourcegroup", "region"]},
    appinsights: {name: "Application Insights", short: "App Insights", also: ["apm", "tracing", "monitor"], icon: "azure:monitor", in: ["resourcegroup", "region"]},
    grafana: {name: "Managed Grafana", also: ["dashboard", "grafana"], icon: "azure:monitor", in: ["resourcegroup", "region"]},
    sentinel: {name: "Microsoft Sentinel", also: ["siem", "soar"], icon: "azure:shield", in: ["resourcegroup", "subscription"]},
    defender: {name: "Defender for Cloud", also: ["security", "posture"], icon: "azure:shield", in: ["subscription"]},
    backup: {name: "Backup vault", also: ["backup", "recovery services"], icon: "azure:nas", in: ["resourcegroup", "region"]},
    siterecovery: {name: "Site Recovery", also: ["disaster recovery", "dr"], icon: "azure:nas", in: ["resourcegroup", "region"]},
    arc: {name: "Azure Arc", also: ["hybrid", "multicloud"], icon: "azure:cloud", in: ["resourcegroup", "subscription"]},
    externalid: {name: "Entra External ID", also: ["customer login", "b2c", "auth"], icon: "azure:login", in: ["subscription"]},
    aisearch: {name: "Azure AI Search", also: ["search", "vector search", "rag"], icon: "azure:search", in: ["resourcegroup", "region", "subnet", "vnet"]},
    machinelearning: {name: "Azure Machine Learning", also: ["ml", "model training"], icon: "azure:ai", in: ["resourcegroup", "region"]},
    documentintelligence: {name: "Document Intelligence", also: ["ocr", "document", "form recognizer"], icon: "azure:file", in: ["resourcegroup", "region"]},
    devops: {name: "Azure DevOps / Pipelines", short: "Azure Pipelines", also: ["ci", "cd", "pipeline"], icon: "azure:ci"},
  },
  lines: {
    event: {name: "Event or message", style: "event"},
    peering: {name: "VNet peering", style: "peering"},
    iam: {name: "Permission (RBAC)", style: "permission"},
    replication: {name: "Replication", style: "replication"},
  },
};

PROFILES.huawei = {
  label: "Huawei Cloud",
  family: "huawei",
  kinds: {
    region: {name: "Region", zone: true, icon: "huawei:cloud", in: ["enterpriseproject"]},
    vpc: {name: "VPC", zone: true, icon: "huawei:vpc", in: ["region"], props: {cidr: ""}},
    az: {name: "Availability Zone", short: "AZ", zone: true, icon: "huawei:datacenter", in: ["vpc", "region"]},
    subnet: {name: "Subnet", zone: true, icon: "huawei:network", in: ["vpc", "az"], props: {cidr: ""}},
    sg: {name: "Security group", also: ["security group", "firewall"], zone: true, see: true, icon: "huawei:shield", in: ["vpc", "subnet", "az"], props: {rules: ""}},
    ecs: {name: "ECS", also: ["vm", "server", "instance"], zone: "also", icon: "huawei:ecs", runs: ["container"], in: ["subnet"], props: {flavor: "", os: ""}},
    cce: {name: "CCE cluster", also: ["kubernetes", "k8s"], zone: "also", icon: "huawei:cce", runs: ["k8s"], in: ["vpc", "subnet"]},
    cci: {name: "CCI container", also: ["container"], icon: "huawei:cci", in: ["region", "subnet"]},
    functiongraph: {name: "FunctionGraph", icon: "huawei:functiongraph", in: ["region"]},
    elb: {name: "ELB", also: ["lb", "load balancer"], icon: "huawei:elb", in: ["subnet", "vpc"]},
    nat: {name: "NAT Gateway", icon: "huawei:nat", in: ["vpc", "subnet"]},
    vpn: {name: "VPN", icon: "huawei:vpn", in: ["vpc", "region"]},
    directconnect: {name: "Direct Connect", icon: "huawei:directconnect", in: ["region"]},
    er: {name: "Enterprise Router", icon: "huawei:er", in: ["region"]},
    apig: {name: "API Gateway", icon: "huawei:apig", in: ["region", "vpc"]},
    waf: {name: "WAF", icon: "huawei:waf", in: ["region"]},
    cdn: {name: "CDN", icon: "huawei:cdn"},
    dns: {name: "DNS", icon: "huawei:dns"},
    rds: {name: "RDS", also: ["db", "database"], icon: "huawei:rds", in: ["subnet", "vpc"], props: {engine: ["mysql", "postgres", "sqlserver", "mariadb"], flavor: ""}},
    gaussdb: {name: "GaussDB", icon: "huawei:gaussdb", in: ["subnet", "vpc"]},
    dcs: {name: "DCS (Redis / Memcached)", short: "DCS", also: ["redis", "cache", "memcached"], icon: "huawei:dcs", in: ["subnet", "vpc"], props: {engine: ["redis", "memcached"]}},
    obs: {name: "OBS bucket", also: ["bucket"], icon: "huawei:obs", in: ["region"]},
    sfs: {name: "Scalable File Service", short: "SFS", also: ["nfs", "file share", "sfs turbo"], icon: "huawei:sfs", in: ["vpc", "subnet"], props: {type: ["SFS", "SFS Turbo"]}},
    evs: {name: "EVS disk", icon: "huawei:evs", in: ["az", "subnet"]},
    smn: {name: "SMN topic", icon: "huawei:smn", in: ["region"]},
    dms: {name: "DMS (Kafka / RabbitMQ / RocketMQ)", short: "DMS", also: ["kafka", "queue", "rabbitmq", "rocketmq"], icon: "huawei:dms", in: ["vpc", "subnet"], props: {engine: ["kafka", "rabbitmq", "rocketmq"]}},
    iam: {name: "IAM", icon: "huawei:iam"},
    kms: {name: "KMS (Data Encryption Workshop)", short: "KMS", also: ["dew", "key", "secret"], icon: "huawei:kms", in: ["region"]},
    ces: {name: "Cloud Eye", icon: "huawei:ces", in: ["region"]},
    lts: {name: "Log Tank Service", icon: "huawei:lts", in: ["region"]},
    swr: {name: "SWR registry", also: ["registry", "image"], icon: "huawei:swr", in: ["region"]},
    enterpriseproject: {name: "Enterprise project", also: ["project", "account"], zone: true, icon: "huawei:folder"},
    flexus: {name: "Flexus instance", short: "Flexus", also: ["vm", "server", "lightweight"], zone: "also", icon: "huawei:vm", runs: ["container"], in: ["subnet"], props: {flavor: "", os: ""}},
    bms: {name: "Bare Metal Server", short: "BMS", also: ["bare metal", "physical server"], zone: "also", icon: "huawei:server", runs: ["container"], in: ["subnet"], props: {flavor: "", os: ""}},
    as: {name: "Auto Scaling group", short: "AS group", also: ["autoscaling", "scaling group"], zone: "also", icon: "huawei:vm", runs: ["container"], in: ["subnet", "vpc"], props: {min: "", max: ""}},
    gpu: {name: "GPU Accelerated Cloud Server", short: "GPU server", also: ["gpu", "gacs"], icon: "huawei:vm", in: ["subnet"], props: {flavor: ""}},
    cae: {name: "Cloud Application Engine", short: "CAE", also: ["serverless", "container", "paas"], icon: "huawei:container", in: ["region", "vpc"]},
    servicestage: {name: "ServiceStage", also: ["paas", "microservice"], icon: "huawei:server", in: ["region", "vpc"]},
    cse: {name: "Cloud Service Engine", short: "CSE", also: ["microservice", "service registry", "mesh"], icon: "huawei:network", in: ["vpc", "subnet"]},
    eip: {name: "Elastic IP", short: "EIP", also: ["public ip"], icon: "huawei:network", in: ["vpc", "region"], props: {bandwidth: ""}},
    vpcep: {name: "VPC Endpoint", short: "VPCEP", also: ["private link", "endpoint"], icon: "huawei:plug", in: ["vpc", "subnet"]},
    cloudconnect: {name: "Cloud Connect", also: ["cross-region", "backbone"], icon: "huawei:topic", in: ["region"]},
    ga: {name: "Global Accelerator", also: ["acceleration", "anycast"], icon: "huawei:network", in: ["region"]},
    aad: {name: "Anti-DDoS", also: ["ddos"], icon: "huawei:shield", in: ["region"]},
    cfw: {name: "Cloud Firewall", short: "CFW", also: ["firewall"], icon: "huawei:firewall", in: ["region", "vpc"]},
    hss: {name: "Host Security Service", short: "HSS", also: ["antivirus", "edr", "host security"], icon: "huawei:shield", in: ["region"]},
    cbh: {name: "Cloud Bastion Host", short: "CBH", also: ["bastion", "jump host"], icon: "huawei:terminal", in: ["subnet", "vpc"]},
    dbss: {name: "Database Security Service", short: "DBSS", also: ["database audit"], icon: "huawei:shield", in: ["subnet", "vpc"]},
    ccm: {name: "Cloud Certificate Manager", short: "CCM", also: ["tls", "ssl", "certificate"], icon: "huawei:key", in: ["region"]},
    secmaster: {name: "SecMaster", also: ["siem", "soc", "security"], icon: "huawei:shield", in: ["region"]},
    taurusdb: {name: "TaurusDB", also: ["mysql", "db", "database"], icon: "huawei:database", in: ["subnet", "vpc"], props: {flavor: ""}},
    geminidb: {name: "GeminiDB", also: ["nosql", "redis", "cassandra", "influxdb"], icon: "huawei:table", in: ["subnet", "vpc"], props: {api: ["redis", "cassandra", "mongodb", "influx"]}},
    dds: {name: "Document Database Service", short: "DDS", also: ["mongodb", "document", "nosql"], icon: "huawei:table", in: ["subnet", "vpc"]},
    ddm: {name: "Distributed Database Middleware", short: "DDM", also: ["sharding"], icon: "huawei:database", in: ["subnet", "vpc"]},
    drs: {name: "Data Replication Service", short: "DRS", also: ["migration", "cdc", "replication"], icon: "huawei:stream", in: ["region", "vpc", "subnet"]},
    dws: {name: "Data Warehouse Service", short: "DWS", also: ["warehouse", "gaussdb dws"], icon: "huawei:warehouse", in: ["subnet", "vpc"]},
    mrs: {name: "MapReduce Service", short: "MRS", also: ["hadoop", "spark", "big data"], icon: "huawei:stream", in: ["subnet", "vpc"]},
    dli: {name: "Data Lake Insight", short: "DLI", also: ["spark", "flink", "data lake"], icon: "huawei:warehouse", in: ["region"]},
    css: {name: "Cloud Search Service", short: "CSS", also: ["search", "elasticsearch", "opensearch"], icon: "huawei:search", in: ["subnet", "vpc"]},
    dataarts: {name: "DataArts Studio", also: ["etl", "data governance", "pipeline"], icon: "huawei:workflow", in: ["region"]},
    dis: {name: "Data Ingestion Service", short: "DIS", also: ["stream", "ingest"], icon: "huawei:stream", in: ["region"]},
    roma: {name: "ROMA Connect", also: ["integration", "esb", "connector"], icon: "huawei:plug", in: ["region", "vpc"]},
    cbr: {name: "Cloud Backup and Recovery", short: "CBR", also: ["backup"], icon: "huawei:nas", in: ["region"]},
    aom: {name: "Application Operations Management", short: "AOM", also: ["apm", "monitor", "prometheus"], icon: "huawei:monitor", in: ["region"]},
    cts: {name: "Cloud Trace Service", short: "CTS", also: ["audit", "audit log"], icon: "huawei:log", in: ["region"]},
    codearts: {name: "CodeArts Pipeline", short: "CodeArts", also: ["ci", "cd", "pipeline", "devops"], icon: "huawei:ci", in: ["region"]},
    modelarts: {name: "ModelArts / MaaS", short: "ModelArts", also: ["ai", "ml", "pangu", "llm"], icon: "huawei:ai", in: ["region"]},
  },
  lines: {
    event: {name: "Event or message", style: "event"},
    peering: {name: "VPC peering", style: "peering"},
    iam: {name: "Permission (IAM)", style: "permission"},
  },
};

// A company's own machines: rooms, racks, servers and the networks between them.
PROFILES.onprem = {
  label: "On-prem",
  family: "onprem",
  kinds: {
    datacenter: {name: "Data center", zone: true, icon: "onprem:datacenter"},
    rack: {name: "Rack", zone: true, icon: "onprem:rack", in: ["datacenter"]},
    vlan: {name: "VLAN / network segment", short: "VLAN", also: ["network", "segment", "subnet"], zone: true, icon: "onprem:network", in: ["datacenter", "dmz", "site"], props: {id: "", cidr: ""}},
    dmz: {name: "DMZ", zone: true, icon: "onprem:shield", in: ["datacenter", "site"]},
    server: {name: "Physical server", short: "Server", also: ["host", "machine", "bare metal"], zone: "also", icon: "onprem:server", runs: ["container", "k8s"], in: ["rack", "datacenter", "vlan", "dmz", "site"], props: {cpu: "", memory: "", os: ""}},
    vm: {name: "Virtual machine", short: "VM", also: ["server", "vmware"], zone: "also", icon: "onprem:vm", runs: ["container", "k8s"], in: ["server", "vlan", "datacenter", "dmz", "cluster", "hypervisor"], props: {cpu: "", memory: "", os: ""}},
    firewall: {name: "Firewall", icon: "onprem:firewall", in: ["datacenter", "rack", "dmz", "vlan", "site"], props: {model: ""}},
    router: {name: "Router", icon: "onprem:router", in: ["datacenter", "rack", "site"]},
    switch: {name: "Switch", icon: "onprem:switch", in: ["datacenter", "rack", "vlan", "site"]},
    loadbalancer: {name: "Load balancer", also: ["lb", "f5"], icon: "onprem:loadbalancer", in: ["datacenter", "rack", "dmz", "vlan"], props: {model: ""}},
    vpn: {name: "VPN gateway", icon: "onprem:vpn", in: ["datacenter", "dmz", "site"]},
    database: {name: "Database", also: ["db", "oracle", "postgres", "mysql", "sql server"], icon: "onprem:database", in: ["server", "vm", "vlan", "datacenter"], props: {engine: ""}},
    storage: {name: "Storage (NAS / SAN)", short: "Storage", also: ["nas", "san", "disk"], icon: "onprem:storage", in: ["datacenter", "rack", "vlan"], props: {size: ""}},
    directory: {name: "Directory (AD / LDAP)", short: "Directory", also: ["ad", "ldap", "active directory"], icon: "onprem:ad", in: ["server", "vm", "vlan", "datacenter"]},
    site: {name: "Site / office / branch", short: "Site", also: ["office", "branch", "campus", "headquarters"], zone: true, icon: "onprem:users"},
    cluster: {name: "Virtualization cluster", short: "Cluster", also: ["vsphere", "vcenter", "proxmox", "hyper-v", "nutanix"], zone: true, icon: "onprem:vmware", runs: ["container"], in: ["datacenter", "rack", "vlan"]},
    hypervisor: {name: "Hypervisor host", short: "Hypervisor", also: ["esxi", "proxmox", "hyper-v", "kvm"], zone: "also", icon: "onprem:server", runs: ["container"], in: ["rack", "datacenter", "cluster", "vlan"], props: {cpu: "", memory: ""}},
    appserver: {name: "Application server", short: "App server", also: ["tomcat", "weblogic", "websphere", "jboss", "iis", "middleware"], zone: "also", icon: "onprem:server", runs: ["container"], in: ["server", "vm", "vlan", "datacenter", "dmz"], props: {platform: ""}},
    proxy: {name: "Proxy (forward / reverse)", short: "Proxy", also: ["reverse proxy", "nginx", "haproxy", "squid"], icon: "onprem:gateway", in: ["dmz", "vlan", "datacenter", "server", "vm"]},
    waf: {name: "Web application firewall", short: "WAF", also: ["waf"], icon: "onprem:firewall", in: ["dmz", "datacenter", "rack", "vlan"]},
    ids: {name: "IDS / IPS", also: ["intrusion detection", "intrusion prevention"], icon: "onprem:shield", in: ["datacenter", "rack", "dmz", "vlan"]},
    dnsserver: {name: "DNS / DHCP server", short: "DNS", also: ["dns", "dhcp", "bind"], icon: "onprem:dns", in: ["server", "vm", "vlan", "datacenter", "dmz"]},
    mailserver: {name: "Mail server", also: ["smtp", "exchange", "email"], icon: "onprem:email", in: ["server", "vm", "vlan", "datacenter", "dmz"]},
    fileserver: {name: "File server", also: ["smb", "nfs", "file share"], icon: "onprem:folder", in: ["server", "vm", "vlan", "datacenter"]},
    objectstorage: {name: "Object storage", also: ["minio", "ceph", "s3 compatible", "bucket"], icon: "onprem:bucket", in: ["datacenter", "rack", "vlan", "server", "vm"]},
    backupserver: {name: "Backup server / tape", short: "Backup", also: ["backup", "veeam", "tape"], icon: "onprem:nas", in: ["datacenter", "rack", "vlan"]},
    cache: {name: "Cache", also: ["redis", "memcached"], icon: "onprem:cache", in: ["server", "vm", "vlan", "datacenter"]},
    mq: {name: "Message queue", short: "Queue", also: ["ibm mq", "rabbitmq", "kafka", "activemq", "queue"], icon: "onprem:queue", in: ["server", "vm", "vlan", "datacenter"]},
    mainframe: {name: "Mainframe", also: ["ibm z", "as/400", "cobol"], icon: "onprem:server", in: ["datacenter", "rack"]},
    siem: {name: "SIEM / log server", short: "SIEM", also: ["syslog", "splunk", "qradar", "elk", "logs"], icon: "onprem:log", in: ["server", "vm", "vlan", "datacenter"]},
    monitoring: {name: "Monitoring", also: ["zabbix", "nagios", "prometheus", "grafana"], icon: "onprem:monitor", in: ["server", "vm", "vlan", "datacenter"]},
    bastion: {name: "Jump host / PAM", short: "Jump host", also: ["bastion", "pam", "cyberark"], icon: "onprem:terminal", in: ["vlan", "dmz", "datacenter", "server", "vm"]},
    hsm: {name: "HSM", also: ["hardware security module", "keys"], icon: "onprem:key", in: ["datacenter", "rack"]},
    cicd: {name: "CI/CD server", short: "CI/CD", also: ["jenkins", "gitlab", "ci", "build"], icon: "onprem:ci", in: ["server", "vm", "vlan", "datacenter"]},
    accesspoint: {name: "Wi-Fi access point", short: "Access point", also: ["wifi", "wireless", "ap"], icon: "onprem:network", in: ["site", "vlan"]},
  },
  lines: {
    replication: {name: "Replication", style: "replication"},
    backup: {name: "Backup", style: "backup"},
    wan: {name: "WAN / VPN link", style: "peering"},
  },
};

// Containers on a machine: a host, its compose projects and networks, the containers and what they mount.
PROFILES.container = {
  label: "Container",
  family: null,
  kinds: {
    host: {name: "Container host", short: "Host", also: ["docker", "podman", "docker host"], zone: true, icon: "server", in: ["swarm"], props: {runtime: ["docker", "podman", "containerd"], os: ""}},
    compose: {name: "Compose project", short: "Compose", also: ["docker compose", "stack"], zone: true, icon: "folder", in: ["host"]},
    network: {name: "Container network", short: "Network", also: ["docker network", "bridge"], zone: true, icon: "network", in: ["host", "compose"], props: {driver: ["bridge", "host", "overlay", "macvlan", "ipvlan"]}},
    container: {name: "Container", also: ["docker", "service"], icon: "container", in: ["host", "compose", "network", "pod", "swarm"], props: {image: "", ports: "", replicas: "", restart: ["no", "always", "unless-stopped", "on-failure"]}},
    volume: {name: "Volume", also: ["disk", "mount"], icon: "folder", in: ["host", "compose", "swarm"], props: {mount: "", driver: ""}},
    envfile: {name: "Env / config file", short: ".env", also: ["env", ".env", "config"], icon: "config", in: ["host", "compose"]},
    registry: {name: "Image registry", also: ["image"], icon: "registry"},
    swarm: {name: "Swarm cluster", short: "Swarm", also: ["docker swarm", "cluster"], zone: true, icon: "cluster"},
    pod: {name: "Podman pod", short: "Pod", also: ["podman pod"], zone: "also", icon: "pod", in: ["host", "network"]},
    proxy: {name: "Reverse proxy", short: "Proxy", also: ["traefik", "nginx", "caddy", "ingress"], icon: "gateway", in: ["host", "compose", "network", "swarm"], props: {ports: ""}},
    secret: {name: "Secret", also: ["password", "compose secret"], icon: "secret", in: ["host", "compose", "swarm"]},
    config: {name: "Config", also: ["compose config", "config file"], icon: "config", in: ["host", "compose", "swarm"]},
    bindmount: {name: "Bind mount (host folder)", short: "Bind mount", also: ["host path", "folder"], icon: "folder", in: ["host", "compose"], props: {path: ""}},
  },
  lines: {
    uses: {name: "Mounts or reads", style: "uses"},
    depends: {name: "Starts after (depends_on)", style: "selects"},
    publishes: {name: "Publishes a port", style: "routes"},
  },
};

// Kubernetes: a cluster's namespaces, what runs in them, the configs they read, and the policies over their pods.
PROFILES.k8s = {
  label: "Kubernetes",
  family: "k8s",
  kinds: {
    cluster: {name: "Cluster", also: ["kubernetes", "k8s"], zone: true, icon: "cluster", props: {version: ""}},
    namespace: {name: "Namespace", also: ["ns"], zone: true, icon: "k8s:namespace", in: ["cluster"]},
    networkpolicy: {name: "Network policy", also: ["policy", "firewall"], zone: true, see: true, icon: "k8s:networkpolicy", in: ["namespace"], props: {rules: ""}},
    deployment: {name: "Deployment", also: ["pod", "app"], icon: "k8s:deployment", in: ["namespace"], props: {replicas: "", image: "", containers: ""}},
    statefulset: {name: "StatefulSet", icon: "k8s:statefulset", in: ["namespace"], props: {replicas: "", image: "", containers: ""}},
    daemonset: {name: "DaemonSet", icon: "k8s:daemonset", in: ["namespace", "node", "nodepool"], props: {image: "", containers: ""}},
    cronjob: {name: "CronJob", icon: "k8s:cronjob", in: ["namespace"], props: {schedule: "", image: "", containers: "", suspended: ["yes", "no"]}},
    job: {name: "Job", icon: "k8s:job", in: ["namespace"], props: {image: "", containers: ""}},
    pod: {name: "Pod", icon: "k8s:pod", in: ["namespace", "node", "nodepool"], props: {image: "", containers: ""}},
    service: {name: "Service", also: ["svc"], icon: "k8s:service", in: ["namespace"], props: {type: ["ClusterIP", "NodePort", "LoadBalancer", "ExternalName", "Headless"], port: ""}},
    ingress: {name: "Ingress", icon: "k8s:ingress", in: ["namespace"], props: {host: ""}},
    configmap: {name: "ConfigMap", also: ["config"], icon: "k8s:configmap", in: ["namespace"]},
    secret: {name: "Secret", also: ["password"], icon: "k8s:secret", in: ["namespace"]},
    pvc: {name: "PersistentVolumeClaim", short: "PVC", also: ["volume", "disk"], icon: "k8s:pvc", in: ["namespace"], props: {size: "", storageClass: ""}},
    pv: {name: "PersistentVolume", short: "PV", also: ["volume", "disk"], icon: "folder", in: ["cluster"], props: {size: ""}},
    hpa: {name: "HorizontalPodAutoscaler", short: "HPA", also: ["autoscale"], icon: "k8s:hpa", in: ["namespace"], props: {min: "", max: ""}},
    serviceaccount: {name: "ServiceAccount", icon: "k8s:serviceaccount", in: ["namespace"]},
    role: {name: "Role / RoleBinding", also: ["rbac"], icon: "identity", in: ["namespace"]},
    nodepool: {name: "Node pool", also: ["node group", "nodes"], zone: true, icon: "k8s:server", in: ["cluster"], props: {size: "", machine: ""}},
    node: {name: "Node", also: ["worker", "machine"], zone: "also", icon: "k8s:server", in: ["cluster", "nodepool"], props: {machine: ""}},
    mesh: {name: "Service mesh", also: ["istio", "linkerd", "mesh"], zone: true, see: true, icon: "k8s:network", in: ["cluster", "namespace"]},
    replicaset: {name: "ReplicaSet", icon: "k8s:deployment", in: ["namespace"], props: {replicas: ""}},
    operator: {name: "Operator / controller", short: "Operator", also: ["controller", "crd"], icon: "k8s:workflow", in: ["namespace"]},
    gateway: {name: "Gateway (Gateway API)", short: "Gateway", also: ["gateway api", "load balancer"], icon: "k8s:ingress", in: ["namespace"], props: {class: "", listeners: ""}},
    route: {name: "Route (HTTPRoute, GRPCRoute…)", short: "Route", also: ["httproute", "grpcroute", "tlsroute"], icon: "k8s:api", in: ["namespace"], props: {type: ["HTTP", "GRPC", "TLS", "TCP"], host: ""}},
    pdb: {name: "PodDisruptionBudget", short: "PDB", also: ["disruption"], icon: "k8s:shield", in: ["namespace"], props: {minAvailable: ""}},
    vpa: {name: "VerticalPodAutoscaler", short: "VPA", also: ["autoscale"], icon: "k8s:hpa", in: ["namespace"]},
    scaledobject: {name: "ScaledObject (KEDA)", short: "KEDA", also: ["keda", "autoscale", "event scaling"], icon: "k8s:hpa", in: ["namespace"], props: {trigger: ""}},
    resourcequota: {name: "ResourceQuota / LimitRange", short: "Quota", also: ["limits", "quota"], icon: "k8s:monitor", in: ["namespace"]},
    storageclass: {name: "StorageClass", also: ["storage", "csi"], icon: "k8s:nas", in: ["cluster"], props: {provisioner: ""}},
    clusterrole: {name: "ClusterRole / ClusterRoleBinding", short: "ClusterRole", also: ["rbac"], icon: "k8s:identity", in: ["cluster"]},
    crd: {name: "CustomResourceDefinition", short: "CRD", also: ["custom resource"], icon: "k8s:code", in: ["cluster"]},
    certificate: {name: "Certificate (cert-manager)", short: "Certificate", also: ["cert-manager", "tls"], icon: "k8s:key", in: ["namespace"]},
    externalsecret: {name: "ExternalSecret", also: ["external secrets", "vault", "secret store"], icon: "k8s:secret", in: ["namespace"]},
    gitopsapp: {name: "GitOps app (Argo CD / Flux)", short: "GitOps app", also: ["argo cd", "argocd", "flux", "gitops"], icon: "k8s:ci", in: ["namespace", "cluster"]},
  },
  lines: {
    uses: {name: "Reads config or secret", style: "uses"},
    mounts: {name: "Mounts a volume", style: "mounts"},
    selects: {name: "Selects pods", style: "selects"},
    routes: {name: "Routes to", style: "routes"},
    scales: {name: "Scales", style: "event"},
  },
};

// {profile, key, def} for "aws:rds", or null.
export function kindOf(name) {
  if (typeof name !== "string") return null;
  const [p, k] = name.split(":");
  const def = PROFILES[p]?.kinds?.[k];
  return def ? {profile: p, key: k, def} : null;
}
export function lineKindOf(name) {
  if (typeof name !== "string") return null;
  const [p, k] = name.split(":");
  const def = PROFILES[p]?.lines?.[k];
  return def ? {profile: p, key: k, def} : null;
}
// Kinds that can be a box (zone: false) or a zone (zone: true), as "profile:key".
export const kindNames = (zone = false) => Object.entries(PROFILES).flatMap(([p, pr]) => Object.entries(pr.kinds)
  .filter(([, d]) => (zone ? d.zone : d.zone !== true)).map(([k]) => `${p}:${k}`));
export const lineKindNames = () => Object.entries(PROFILES).flatMap(([p, pr]) => Object.keys(pr.lines || {}).map((k) => `${p}:${k}`));

// Kinds for a card's search, best first: those of the platform of the zone it goes in, then of the zones around it,
// then of platforms the picture already uses, then the rest; within each, the closest name ("container" before
// "Container Registry"), then a kind that usually sits right there. around: kinds of the zones it is in, nearest first.
export function searchKinds(q, {zone = false, around = [], used = []} = {}) {
  q = String(q || "").trim().toLowerCase();
  const near = around.map(kindOf).filter(Boolean), aroundP = new Set(near.map((k) => k.profile)), usedP = new Set(used), order = Object.keys(PROFILES);
  const out = [];
  kindNames(zone).forEach((k, n) => {
    const it = kindOf(k), name = it.def.name.toLowerCase(), label = PROFILES[it.profile].label.toLowerCase();
    const words = [name, it.key, ...(it.def.also || [])];
    const match = !q ? 1 : name === q || it.key === q ? 5 : name.startsWith(q) || it.key.startsWith(q) ? 4 : (it.def.also || []).some((w) => w === q) ? 3 : words.some((w) => w.includes(q)) ? 2 : label.includes(q) ? 1 : 0;
    if (!match) return;
    const ctx = near[0]?.profile === it.profile ? 3 : aroundP.has(it.profile) ? 2 : usedP.has(it.profile) ? 1 : 0;
    const fits = near.length && near[0].profile === it.profile && it.def.in?.includes(near[0].key) ? 1 : 0;
    out.push({kind: k, profile: it.profile, def: it.def, rank: [ctx, match, fits, -order.indexOf(it.profile), -n]});
  });
  return out.sort((a, b) => {
    for (let i = 0; i < a.rank.length; i++) if (a.rank[i] !== b.rank[i]) return b.rank[i] - a.rank[i];
    return 0;
  });
}

// Every box and zone of a map that sits where its kind does not usually go: [{node | zone, kind, there, usual}].
// nodes: the plan's nodes (a box's kind is on its node).
export function mapWarnings(view, nodes) {
  const out = [];
  const walk = (zs, around, depth) => (Array.isArray(zs) && depth < 9 ? zs : []).forEach((z) => {
    if (!z || typeof z !== "object") return;
    const w = z.kind ? kindWarning(z.kind, around) : null;
    if (w) out.push({zone: z.id ?? z.label, ...w});
    const inner = [z.kind || null, ...around];
    for (const id of Array.isArray(z.nodes) ? z.nodes : []) {
      const k = nodes?.[id]?.kind, wn = k ? kindWarning(k, inner) : null;
      if (wn) out.push({node: id, ...wn});
    }
    walk(z.zones, inner, depth + 1);
  });
  walk(view?.zones, [], 0);
  return out;
}
// What to say about a box or zone of `kind` whose zones are `around` (nearest first, each a kind or null): null when it
// sits where it usually does, or when nothing around it has a kind; else {kind, there, usual} (names).
export function kindWarning(kind, around) {
  const me = kindOf(kind);
  if (!me?.def.in) return null;
  for (const z of around) {
    const it = kindOf(z);
    if (!it || it.def.see) continue;
    // In a zone of another platform: fine where that zone runs this platform's things (containers on a VM or an
    // EC2, Kubernetes in EKS or GKE), else it is not where it usually sits.
    if (it.profile !== me.profile && it.def.runs?.includes(me.profile)) return null;
    const usual = me.def.in.map((k) => PROFILES[me.profile].kinds[k]?.name || k);
    if (it.profile !== me.profile) return {kind: me.def.name, there: `${it.def.name} (${PROFILES[it.profile].label})`, usual, platform: PROFILES[me.profile].label, cross: PROFILES[it.profile].label};
    return me.def.in.includes(it.key) ? null : {kind: me.def.name, there: it.def.name, usual};
  }
  return null;
}

// Problems with what a plan says about kinds (lib/schema.mjs): unknown kinds, a box kind on a zone, unknown props.
export function kindProblems(where, kind, props, zone) {
  const out = [];
  if (kind == null) return out;
  const k = kindOf(kind);
  if (!k) return [`${where}: unknown kind "${kind}" (${Object.keys(PROFILES).map((p) => `${p}:…`).join(", ")})`];
  if (zone && !k.def.zone) out.push(`${where}: "${kind}" is a box, not a zone`);
  if (!zone && k.def.zone === true) out.push(`${where}: "${kind}" is a zone, not a box`);
  if (props != null && (typeof props !== "object" || Array.isArray(props))) out.push(`${where}: props must be {"name": "value"}`);
  else for (const [name, value] of Object.entries(props || {})) {
    const want = k.def.props?.[name];
    if (want == null) out.push(`${where}: ${kind} has no prop "${name}"${k.def.props ? ` (${Object.keys(k.def.props).join(", ")})` : ""}`);
    else if (typeof value !== "string") out.push(`${where}: prop "${name}" must be a string`);
    else if (Array.isArray(want) && !want.includes(value)) out.push(`${where}: prop "${name}" is one of ${want.join(", ")}`);
  }
  return out;
}
