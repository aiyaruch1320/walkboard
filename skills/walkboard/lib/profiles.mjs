// Profiles: what the boxes, zones and lines of a map mean on one platform. A map takes none, one or several: a box, a
// zone or a line with `kind: "aws:rds"` belongs to the aws profile; one without a kind is drawn as the user likes.
// Runs in Node and in the browser: no imports. A new profile is one more entry in PROFILES (see AGENTS.md).
//
// kinds.<key>:
//   name   what it is called (the page and the agent's words)
//   zone   true: only a zone (it holds things); "also": a box, or a zone when it holds something; absent: a box
//   icon   its icon (lib/icons.mjs) unless the box picks another
//   in     the kinds it usually sits in. The page warns, never blocks, when the nearest zone with a kind is another one;
//          a zone without a kind says nothing, so drawing freely never warns. Absent: anywhere.
//   see    a zone that rules look through (a security group: what is in it sits in the subnet around it)
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
      az: {name: "Availability Zone", zone: true, icon: "datacenter", in: ["vpc", "region"]},
      subnet: {name: "Subnet", zone: true, icon: "network", in: ["vpc", "az"], props: {access: ["private", "public"], cidr: ""}},
      sg: {name: "Security group", zone: true, see: true, icon: "aws:securitygroup", in: ["vpc", "subnet", "az"], props: {rules: ""}},
      ec2: {name: "EC2", zone: "also", icon: "aws:ec2", in: ["subnet"], props: {type: "", os: ""}},
      ecs: {name: "ECS cluster", zone: "also", icon: "aws:ecs", in: ["vpc", "subnet", "region"]},
      fargate: {name: "Fargate task", icon: "aws:fargate", in: ["ecs", "subnet"], props: {cpu: "", memory: ""}},
      eks: {name: "EKS cluster", zone: "also", icon: "aws:eks", in: ["vpc", "region"], props: {version: ""}},
      lambda: {name: "Lambda", icon: "aws:lambda", in: ["region", "account", "vpc", "subnet"], props: {runtime: ""}},
      alb: {name: "Application Load Balancer", icon: "aws:alb", in: ["subnet", "vpc"], props: {scheme: ["internet-facing", "internal"]}},
      nlb: {name: "Network Load Balancer", icon: "aws:nlb", in: ["subnet", "vpc"], props: {scheme: ["internet-facing", "internal"]}},
      internetgateway: {name: "Internet Gateway", icon: "aws:internetgateway", in: ["vpc"]},
      natgateway: {name: "NAT Gateway", icon: "aws:natgateway", in: ["subnet"]},
      endpoint: {name: "VPC endpoint", icon: "aws:endpoint", in: ["vpc", "subnet"], props: {service: ""}},
      transitgateway: {name: "Transit Gateway", icon: "aws:transitgateway", in: ["region", "account"]},
      vpn: {name: "Site-to-Site VPN", icon: "aws:vpn", in: ["vpc", "region"]},
      directconnect: {name: "Direct Connect", icon: "aws:directconnect", in: ["region", "account"], props: {bandwidth: ""}},
      apigateway: {name: "API Gateway", icon: "aws:apigateway", in: ["region", "account"], props: {type: ["REST", "HTTP", "WebSocket"]}},
      cloudfront: {name: "CloudFront", icon: "aws:cloudfront", in: ["account"]},
      route53: {name: "Route 53", icon: "aws:route53", in: ["account"]},
      waf: {name: "WAF", icon: "aws:waf", in: ["account", "region"]},
      rds: {name: "RDS", icon: "aws:rds", in: ["subnet", "vpc"], props: {engine: ["postgres", "mysql", "mariadb", "oracle", "sqlserver"], size: "", multiAz: ["yes", "no"]}},
      aurora: {name: "Aurora", icon: "aws:aurora", in: ["subnet", "vpc"], props: {engine: ["postgres", "mysql"], size: "", serverless: ["yes", "no"]}},
      dynamodb: {name: "DynamoDB", icon: "aws:dynamodb", in: ["region", "account"], props: {capacity: ["on-demand", "provisioned"]}},
      elasticache: {name: "ElastiCache", icon: "aws:elasticache", in: ["subnet", "vpc"], props: {engine: ["redis", "valkey", "memcached"], size: ""}},
      redshift: {name: "Redshift", icon: "aws:redshift", in: ["subnet", "vpc"]},
      s3: {name: "S3 bucket", icon: "aws:s3", in: ["region", "account"], props: {versioning: ["on", "off"]}},
      efs: {name: "EFS", icon: "aws:efs", in: ["vpc", "subnet"]},
      sqs: {name: "SQS queue", icon: "aws:sqs", in: ["region", "account"], props: {type: ["standard", "fifo"]}},
      sns: {name: "SNS topic", icon: "aws:sns", in: ["region", "account"]},
      eventbridge: {name: "EventBridge", icon: "aws:eventbridge", in: ["region", "account"]},
      kinesis: {name: "Kinesis", icon: "aws:kinesis", in: ["region", "account"]},
      msk: {name: "MSK (Kafka)", icon: "aws:msk", in: ["vpc", "subnet"]},
      stepfunctions: {name: "Step Functions", icon: "aws:stepfunctions", in: ["region", "account"]},
      secretsmanager: {name: "Secrets Manager", icon: "aws:secretsmanager", in: ["region", "account"]},
      kms: {name: "KMS key", icon: "aws:kms", in: ["region", "account"]},
      iam: {name: "IAM role", icon: "aws:iam", in: ["account"]},
      cognito: {name: "Cognito", icon: "aws:cognito", in: ["region", "account"]},
      cloudwatch: {name: "CloudWatch", icon: "aws:cloudwatch", in: ["region", "account"]},
      ecr: {name: "ECR", icon: "aws:ecr", in: ["region", "account"]},
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
    org: {name: "Organization", zone: true, icon: "users"},
    project: {name: "Project", zone: true, icon: "folder", in: ["org"]},
    vpc: {name: "VPC network", zone: true, icon: "gcp:vpc", in: ["project"]},
    region: {name: "Region", zone: true, icon: "cloud", in: ["project", "vpc"]},
    zone: {name: "Zone", zone: true, icon: "datacenter", in: ["region"]},
    subnet: {name: "Subnet", zone: true, icon: "network", in: ["vpc", "region"], props: {cidr: ""}},
    firewall: {name: "Firewall rule", zone: true, see: true, icon: "firewall", in: ["vpc", "subnet"], props: {rules: ""}},
    gce: {name: "Compute Engine VM", zone: "also", icon: "vm", in: ["subnet", "zone"], props: {type: "", os: ""}},
    gke: {name: "GKE cluster", zone: "also", icon: "gcp:gke", in: ["vpc", "region", "subnet"], props: {mode: ["autopilot", "standard"]}},
    cloudrun: {name: "Cloud Run", icon: "gcp:cloudrun", in: ["region", "project"], props: {cpu: "", memory: ""}},
    functions: {name: "Cloud Functions", icon: "gcp:functions", in: ["region", "project"], props: {runtime: ""}},
    loadbalancer: {name: "Load balancer", icon: "gcp:loadbalancing", in: ["project", "vpc", "region"], props: {scheme: ["external", "internal"]}},
    armor: {name: "Cloud Armor", icon: "gcp:cloudarmor", in: ["project"]},
    cdn: {name: "Cloud CDN", icon: "gcp:cdn", in: ["project"]},
    dns: {name: "Cloud DNS", icon: "gcp:dns", in: ["project"]},
    nat: {name: "Cloud NAT", icon: "gateway", in: ["region", "vpc"]},
    vpn: {name: "Cloud VPN", icon: "gcp:vpn", in: ["region", "vpc"]},
    interconnect: {name: "Cloud Interconnect", icon: "gcp:interconnect", in: ["region", "project"]},
    cloudsql: {name: "Cloud SQL", icon: "gcp:cloudsql", in: ["region", "vpc", "project"], props: {engine: ["postgres", "mysql", "sqlserver"], tier: "", ha: ["yes", "no"]}},
    spanner: {name: "Spanner", icon: "gcp:spanner", in: ["region", "project"]},
    firestore: {name: "Firestore", icon: "gcp:firestore", in: ["region", "project"]},
    memorystore: {name: "Memorystore", icon: "gcp:memorystore", in: ["vpc", "region"], props: {engine: ["redis", "valkey", "memcached"], size: ""}},
    bigquery: {name: "BigQuery", icon: "gcp:bigquery", in: ["region", "project"]},
    gcs: {name: "Cloud Storage bucket", icon: "gcp:gcs", in: ["region", "project"], props: {class: ["standard", "nearline", "coldline", "archive"]}},
    pubsub: {name: "Pub/Sub topic", icon: "gcp:pubsub", in: ["project"]},
    dataflow: {name: "Dataflow", icon: "gcp:dataflow", in: ["region", "project"]},
    composer: {name: "Composer (Airflow)", icon: "gcp:composer", in: ["region", "project"]},
    scheduler: {name: "Cloud Scheduler", icon: "gcp:scheduler", in: ["region", "project"], props: {schedule: ""}},
    secretmanager: {name: "Secret Manager", icon: "gcp:secretmanager", in: ["project"]},
    kms: {name: "Cloud KMS", icon: "gcp:kms", in: ["region", "project"]},
    iam: {name: "Service account", icon: "gcp:iam", in: ["project"]},
    logging: {name: "Cloud Logging", icon: "gcp:logging", in: ["project"]},
    monitoring: {name: "Cloud Monitoring", icon: "gcp:monitoring", in: ["project"]},
    artifactregistry: {name: "Artifact Registry", icon: "gcp:artifactregistry", in: ["region", "project"]},
    vertexai: {name: "Vertex AI", icon: "gcp:vertexai", in: ["region", "project"]},
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
    subscription: {name: "Subscription", zone: true, icon: "key"},
    resourcegroup: {name: "Resource group", zone: true, icon: "folder", in: ["subscription"]},
    region: {name: "Region", zone: true, icon: "cloud", in: ["subscription", "resourcegroup"]},
    vnet: {name: "Virtual network", zone: true, icon: "azure:vnet", in: ["resourcegroup", "region", "subscription"], props: {cidr: ""}},
    subnet: {name: "Subnet", zone: true, icon: "network", in: ["vnet"], props: {cidr: ""}},
    nsg: {name: "Network security group", zone: true, see: true, icon: "shield", in: ["vnet", "subnet"], props: {rules: ""}},
    vm: {name: "Virtual machine", zone: "also", icon: "azure:vm", in: ["subnet"], props: {size: "", os: ""}},
    aks: {name: "AKS cluster", zone: "also", icon: "azure:aks", in: ["vnet", "subnet", "resourcegroup"]},
    appservice: {name: "App Service", icon: "azure:appservice", in: ["resourcegroup", "region", "subnet"], props: {plan: ""}},
    functions: {name: "Functions", icon: "azure:functions", in: ["resourcegroup", "region"], props: {runtime: ""}},
    appgateway: {name: "Application Gateway", icon: "azure:appgateway", in: ["subnet", "vnet"]},
    loadbalancer: {name: "Load Balancer", icon: "loadbalancer", in: ["subnet", "vnet", "resourcegroup"], props: {scheme: ["public", "internal"]}},
    frontdoor: {name: "Front Door", icon: "azure:frontdoor", in: ["subscription", "resourcegroup"]},
    firewall: {name: "Azure Firewall", icon: "azure:firewall", in: ["subnet", "vnet"]},
    vpngateway: {name: "VPN Gateway", icon: "azure:vpngateway", in: ["subnet", "vnet"]},
    expressroute: {name: "ExpressRoute", icon: "azure:expressroute", in: ["resourcegroup", "region", "subscription"]},
    apim: {name: "API Management", icon: "azure:apim", in: ["resourcegroup", "subnet"]},
    sql: {name: "Azure SQL", icon: "azure:sql", in: ["resourcegroup", "region"], props: {tier: ""}},
    postgres: {name: "Database for PostgreSQL", icon: "database", in: ["resourcegroup", "subnet", "region"], props: {tier: ""}},
    cosmosdb: {name: "Cosmos DB", icon: "azure:cosmosdb", in: ["resourcegroup", "region"], props: {api: ["nosql", "mongodb", "cassandra", "gremlin", "table"]}},
    redis: {name: "Azure Cache for Redis", icon: "cache", in: ["resourcegroup", "subnet", "region"], props: {tier: ""}},
    storage: {name: "Storage account", icon: "azure:storage", in: ["resourcegroup", "region"], props: {kind: ["blob", "files", "queue", "table"]}},
    servicebus: {name: "Service Bus", icon: "azure:servicebus", in: ["resourcegroup", "region"]},
    eventhubs: {name: "Event Hubs", icon: "azure:eventhubs", in: ["resourcegroup", "region"]},
    eventgrid: {name: "Event Grid", icon: "azure:eventgrid", in: ["resourcegroup", "region"]},
    keyvault: {name: "Key Vault", icon: "azure:keyvault", in: ["resourcegroup", "region"]},
    entra: {name: "Entra ID", icon: "azure:entra", in: ["subscription"]},
    monitor: {name: "Azure Monitor", icon: "azure:monitor", in: ["subscription", "resourcegroup"]},
    acr: {name: "Container Registry", icon: "azure:acr", in: ["resourcegroup", "region"]},
    openai: {name: "Azure OpenAI", icon: "azure:openai", in: ["resourcegroup", "region"]},
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
    region: {name: "Region", zone: true, icon: "cloud"},
    vpc: {name: "VPC", zone: true, icon: "huawei:vpc", in: ["region"], props: {cidr: ""}},
    az: {name: "Availability Zone", zone: true, icon: "datacenter", in: ["vpc", "region"]},
    subnet: {name: "Subnet", zone: true, icon: "network", in: ["vpc", "az"], props: {cidr: ""}},
    sg: {name: "Security group", zone: true, see: true, icon: "shield", in: ["vpc", "subnet", "az"], props: {rules: ""}},
    ecs: {name: "ECS", zone: "also", icon: "huawei:ecs", in: ["subnet"], props: {flavor: "", os: ""}},
    cce: {name: "CCE cluster", zone: "also", icon: "huawei:cce", in: ["vpc", "subnet"]},
    cci: {name: "CCI container", icon: "huawei:cci", in: ["region", "subnet"]},
    functiongraph: {name: "FunctionGraph", icon: "huawei:functiongraph", in: ["region"]},
    elb: {name: "ELB", icon: "huawei:elb", in: ["subnet", "vpc"]},
    nat: {name: "NAT Gateway", icon: "huawei:nat", in: ["vpc", "subnet"]},
    vpn: {name: "VPN", icon: "huawei:vpn", in: ["vpc", "region"]},
    directconnect: {name: "Direct Connect", icon: "huawei:directconnect", in: ["region"]},
    er: {name: "Enterprise Router", icon: "huawei:er", in: ["region"]},
    apig: {name: "API Gateway", icon: "huawei:apig", in: ["region", "vpc"]},
    waf: {name: "WAF", icon: "huawei:waf", in: ["region"]},
    cdn: {name: "CDN", icon: "huawei:cdn"},
    dns: {name: "DNS", icon: "huawei:dns"},
    rds: {name: "RDS", icon: "huawei:rds", in: ["subnet", "vpc"], props: {engine: ["mysql", "postgres", "sqlserver"], flavor: ""}},
    gaussdb: {name: "GaussDB", icon: "huawei:gaussdb", in: ["subnet", "vpc"]},
    dcs: {name: "DCS (Redis)", icon: "huawei:dcs", in: ["subnet", "vpc"]},
    obs: {name: "OBS bucket", icon: "huawei:obs", in: ["region"]},
    sfs: {name: "SFS", icon: "huawei:sfs", in: ["vpc", "subnet"]},
    evs: {name: "EVS disk", icon: "huawei:evs", in: ["az", "subnet"]},
    smn: {name: "SMN topic", icon: "huawei:smn", in: ["region"]},
    dms: {name: "DMS (Kafka / RabbitMQ)", icon: "huawei:dms", in: ["vpc", "subnet"]},
    iam: {name: "IAM", icon: "huawei:iam"},
    kms: {name: "KMS", icon: "huawei:kms", in: ["region"]},
    ces: {name: "Cloud Eye", icon: "huawei:ces", in: ["region"]},
    lts: {name: "Log Tank Service", icon: "huawei:lts", in: ["region"]},
    swr: {name: "SWR registry", icon: "huawei:swr", in: ["region"]},
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
    vlan: {name: "VLAN / network segment", zone: true, icon: "network", in: ["datacenter", "dmz"], props: {id: "", cidr: ""}},
    dmz: {name: "DMZ", zone: true, icon: "shield", in: ["datacenter"]},
    server: {name: "Physical server", zone: "also", icon: "onprem:server", in: ["rack", "datacenter", "vlan", "dmz"], props: {cpu: "", memory: "", os: ""}},
    vm: {name: "Virtual machine", zone: "also", icon: "onprem:vm", in: ["server", "vlan", "datacenter", "dmz"], props: {cpu: "", memory: "", os: ""}},
    firewall: {name: "Firewall", icon: "onprem:firewall", in: ["datacenter", "rack", "dmz", "vlan"], props: {model: ""}},
    router: {name: "Router", icon: "onprem:router", in: ["datacenter", "rack"]},
    switch: {name: "Switch", icon: "onprem:switch", in: ["datacenter", "rack", "vlan"]},
    loadbalancer: {name: "Load balancer", icon: "onprem:loadbalancer", in: ["datacenter", "rack", "dmz", "vlan"], props: {model: ""}},
    vpn: {name: "VPN gateway", icon: "onprem:vpn", in: ["datacenter", "dmz"]},
    database: {name: "Database", icon: "onprem:database", in: ["server", "vm", "vlan", "datacenter"], props: {engine: ""}},
    storage: {name: "Storage (NAS / SAN)", icon: "onprem:storage", in: ["datacenter", "rack", "vlan"], props: {size: ""}},
    directory: {name: "Directory (AD / LDAP)", icon: "onprem:ad", in: ["server", "vm", "vlan", "datacenter"]},
  },
  lines: {
    replication: {name: "Replication", style: "replication"},
    backup: {name: "Backup", style: "event"},
  },
};

// Containers on a machine: a host, its compose projects and networks, the containers and what they mount.
PROFILES.container = {
  label: "Container",
  family: null,
  kinds: {
    host: {name: "Container host", zone: true, icon: "server", props: {runtime: ["docker", "podman", "containerd"], os: ""}},
    compose: {name: "Compose project", zone: true, icon: "folder", in: ["host"]},
    network: {name: "Container network", zone: true, icon: "network", in: ["host", "compose"], props: {driver: ["bridge", "host", "overlay"]}},
    container: {name: "Container", icon: "container", in: ["host", "compose", "network"], props: {image: "", ports: "", replicas: ""}},
    volume: {name: "Volume", icon: "folder", in: ["host", "compose"], props: {mount: ""}},
    envfile: {name: "Env / config file", icon: "config", in: ["host", "compose"]},
    registry: {name: "Image registry", icon: "registry"},
  },
  lines: {
    uses: {name: "Mounts or reads", style: "uses"},
  },
};

// Kubernetes: a cluster's namespaces, what runs in them, the configs they read, and the policies over their pods.
PROFILES.k8s = {
  label: "Kubernetes",
  family: "k8s",
  kinds: {
    cluster: {name: "Cluster", zone: true, icon: "cluster", props: {version: ""}},
    namespace: {name: "Namespace", zone: true, icon: "k8s:namespace", in: ["cluster"]},
    networkpolicy: {name: "Network policy", zone: true, see: true, icon: "k8s:networkpolicy", in: ["namespace"], props: {rules: ""}},
    deployment: {name: "Deployment", icon: "k8s:deployment", in: ["namespace"], props: {replicas: "", image: "", containers: ""}},
    statefulset: {name: "StatefulSet", icon: "k8s:statefulset", in: ["namespace"], props: {replicas: "", image: "", containers: ""}},
    daemonset: {name: "DaemonSet", icon: "k8s:daemonset", in: ["namespace"], props: {image: "", containers: ""}},
    cronjob: {name: "CronJob", icon: "k8s:cronjob", in: ["namespace"], props: {schedule: "", image: "", containers: "", suspended: ["yes", "no"]}},
    job: {name: "Job", icon: "k8s:job", in: ["namespace"], props: {image: "", containers: ""}},
    pod: {name: "Pod", icon: "k8s:pod", in: ["namespace"], props: {image: "", containers: ""}},
    service: {name: "Service", icon: "k8s:service", in: ["namespace"], props: {type: ["ClusterIP", "NodePort", "LoadBalancer"], port: ""}},
    ingress: {name: "Ingress", icon: "k8s:ingress", in: ["namespace"], props: {host: ""}},
    configmap: {name: "ConfigMap", icon: "k8s:configmap", in: ["namespace"]},
    secret: {name: "Secret", icon: "k8s:secret", in: ["namespace"]},
    pvc: {name: "PersistentVolumeClaim", icon: "k8s:pvc", in: ["namespace"], props: {size: "", storageClass: ""}},
    hpa: {name: "HorizontalPodAutoscaler", icon: "k8s:hpa", in: ["namespace"], props: {min: "", max: ""}},
    serviceaccount: {name: "ServiceAccount", icon: "k8s:serviceaccount", in: ["namespace"]},
  },
  lines: {
    uses: {name: "Reads config or secret", style: "uses"},
    mounts: {name: "Mounts a volume", style: "uses"},
    selects: {name: "Selects pods", style: "selects"},
    routes: {name: "Routes to", style: "event"},
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

// What to say about a box or zone of `kind` whose zones are `around` (nearest first, each a kind or null): null when it
// sits where it usually does, or when nothing around it has a kind; else {kind, there, usual} (names).
export function kindWarning(kind, around) {
  const me = kindOf(kind);
  if (!me?.def.in) return null;
  for (const z of around) {
    const it = kindOf(z);
    if (!it || it.def.see) continue;
    if (it.profile !== me.profile) return null;
    return me.def.in.includes(it.key) ? null : {kind: me.def.name, there: it.def.name, usual: me.def.in.map((k) => PROFILES[me.profile].kinds[k]?.name || k)};
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
