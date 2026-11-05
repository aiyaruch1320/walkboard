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
