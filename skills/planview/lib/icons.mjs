// Box icons: simple line glyphs drawn for planview (no vendor logos), tinted by provider so AWS, Google Cloud,
// Azure and Kubernetes parts are recognisable at a glance. Runs in Node and the browser.

export const GLYPHS = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.2.6 3.5 2.6 3.5 5.7"/>',
  browser: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M6.5 6.5h.01M9 6.5h.01"/>',
  mobile: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  vm: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  api: '<path d="M8 4c-2 0-3 1-3 3v2c0 1.5-.7 2.5-2 3 1.3.5 2 1.5 2 3v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.5.7 2.5 2 3-1.3.5-2 1.5-2 3v2c0 2-1 3-3 3"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
  cache: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6l1-8z"/>',
  queue: '<path d="M3 7h12M3 12h12M3 17h12M18 9l3 3-3 3"/>',
  topic: '<circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="20" r="2"/><path d="M10.2 10.2 6.4 6.4M13.8 10.2l3.8-3.8M12 14.5V18"/>',
  stream: '<path d="M3 8c3-2 6 2 9 0s6-2 9 0M3 12c3-2 6 2 9 0s6-2 9 0M3 16c3-2 6 2 9 0s6-2 9 0"/>',
  bucket: '<path d="M4 6h16l-2 14H6z"/><ellipse cx="12" cy="6" rx="8" ry="2.5"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
  function: '<path d="M6 4h3l8 16M12.5 11 7 20"/>',
  container: '<path d="M12 2.8 20 7v10l-8 4.2L4 17V7z"/><path d="M4 7l8 4.2L20 7M12 11.2V21"/>',
  pod: '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><circle cx="12" cy="12" r="3"/>',
  deployment: '<rect x="7" y="3" width="13" height="13" rx="2"/><path d="M4 7v11a2 2 0 0 0 2 2h11"/>',
  cluster: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 3.5v6M12 14.5v6M3.5 12h6M14.5 12h6M6 6l4.2 4.2M13.8 13.8 18 18M18 6l-4.2 4.2M10.2 13.8 6 18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  job: '<circle cx="12" cy="12" r="8.5"/><path d="M10 8.5v7l5.5-3.5z"/>',
  secret: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5v-3a4 4 0 0 1 8 0v3M12 15v2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3M16.5 6.5 19 9M14 9l2 2"/>',
  identity: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6z"/><circle cx="12" cy="10" r="2.3"/><path d="M8.5 16c.7-1.6 2-2.5 3.5-2.5s2.8.9 3.5 2.5"/>',
  login: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 16.5c.6-1.7 1.9-2.6 3.5-2.6s2.9.9 3.5 2.6M15 10h3M15 13.5h3"/>',
  config: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  network: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/>',
  gateway: '<path d="M4 4v16M20 4v16M8 12h8M13 9l3 3-3 3"/>',
  loadbalancer: '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 12h10M7 11l10-5M7 13l10 5"/>',
  ingress: '<path d="M3 12h11M10 8l4 4-4 4M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/>',
  dns: '<path d="M12 3v18M12 5h7l2 2.5-2 2.5h-7M12 12H5l-2 2.5L5 17h7"/>',
  cdn: '<circle cx="12" cy="12" r="8.5"/><path d="M13 7l-3 5.5h4l-3 5"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5 3.75 3.75 0 0 1-.5 7.5z"/>',
  monitor: '<path d="M3 20h18M6 16v-4M10.5 16V8M15 16v-6M19.5 16V5"/>',
  log: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  git: '<circle cx="6" cy="5.5" r="2.2"/><circle cx="6" cy="18.5" r="2.2"/><circle cx="18" cy="8" r="2.2"/><path d="M6 7.7v8.6M18 10.2c0 4-6 3-11 6.5"/>',
  ci: '<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9M18.5 3v4.5H14M5.5 21v-4.5H10"/>',
  registry: '<path d="M12 3 21 7.5 12 12 3 7.5z"/><path d="M3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12.5 15H17"/>',
  code: '<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  payment: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
  warehouse: '<path d="M3 9.5 12 4l9 5.5V20H3z"/><path d="M7 20v-6h10v6M7 17h10"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M3 15h18M9.5 4v16"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',
  workflow: '<rect x="3" y="3" width="7" height="6" rx="1.5"/><rect x="14" y="15" width="7" height="6" rx="1.5"/><path d="M6.5 9v3.5a2 2 0 0 0 2 2H13a2 2 0 0 1 2 2V15"/>',
  ai: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.8 2 2 .7-2 .8-.8 2-.7-2-2-.8 2-.7z"/>',
};

export const FAMILIES = {
  aws: {label: "AWS", bg: "#232f3e", fg: "#ff9900"},
  gcp: {label: "Google Cloud", bg: "#1a73e8", fg: "#ffffff"},
  azure: {label: "Azure", bg: "#0078d4", fg: "#ffffff"},
  k8s: {label: "Kubernetes", bg: "#326ce5", fg: "#ffffff"},
};

// "provider:service" names an icon explicitly; the glyph comes from this table, or from the service name when it is a glyph.
const SERVICES = {
  aws: {s3: "bucket", lambda: "function", ec2: "vm", rds: "database", aurora: "database", dynamodb: "table", sqs: "queue", sns: "topic",
    eventbridge: "topic", kinesis: "stream", msk: "stream", apigateway: "gateway", cloudfront: "cdn", route53: "dns", elb: "loadbalancer",
    alb: "loadbalancer", iam: "identity", cognito: "login", cloudwatch: "monitor", eks: "cluster", ecs: "container", fargate: "container",
    ecr: "registry", secretsmanager: "secret", kms: "key", ses: "email", stepfunctions: "workflow", vpc: "network", redshift: "warehouse",
    athena: "search", glue: "workflow", bedrock: "ai", elasticache: "cache", efs: "folder", codepipeline: "ci", codebuild: "ci"},
  gcp: {gcs: "bucket", storage: "bucket", bigquery: "warehouse", pubsub: "topic", cloudrun: "container", run: "container", functions: "function",
    gke: "cluster", cloudsql: "database", firestore: "table", spanner: "database", secretmanager: "secret", kms: "key", iam: "identity",
    logging: "log", monitoring: "monitor", dataflow: "stream", composer: "workflow", vertexai: "ai", cdn: "cdn", dns: "dns",
    loadbalancing: "loadbalancer", artifactregistry: "registry", memorystore: "cache", scheduler: "clock"},
  azure: {blob: "bucket", storage: "bucket", functions: "function", aks: "cluster", sql: "database", cosmosdb: "table", servicebus: "queue",
    eventhubs: "stream", eventgrid: "topic", keyvault: "secret", entra: "identity", monitor: "monitor", appservice: "server", vm: "vm",
    apim: "gateway", frontdoor: "cdn", acr: "registry", openai: "ai"},
  k8s: {pod: "pod", deployment: "deployment", statefulset: "deployment", daemonset: "deployment", cronjob: "clock", job: "job",
    service: "loadbalancer", ingress: "ingress", configmap: "config", secret: "secret", namespace: "folder", networkpolicy: "shield",
    pvc: "folder", serviceaccount: "identity", hpa: "monitor"},
};

// First match wins, so the more specific words come first.
const GUESS = [
  [/\bs3\b/, "aws:s3"], [/\blambda\b/, "aws:lambda"], [/\bec2\b/, "aws:ec2"], [/\b(rds|aurora)\b/, "aws:rds"], [/\bdynamo ?db\b/, "aws:dynamodb"],
  [/\bsqs\b/, "aws:sqs"], [/\bsns\b/, "aws:sns"], [/\beventbridge\b/, "aws:eventbridge"], [/\bkinesis\b/, "aws:kinesis"],
  [/\bcloudfront\b/, "aws:cloudfront"], [/\broute ?53\b/, "aws:route53"], [/\bcognito\b/, "aws:cognito"], [/\bcloudwatch\b/, "aws:cloudwatch"],
  [/\beks\b/, "aws:eks"], [/\b(ecs|fargate)\b/, "aws:ecs"], [/\becr\b/, "aws:ecr"], [/\bsecrets ?manager\b/, "aws:secretsmanager"],
  [/\bstep ?functions\b/, "aws:stepfunctions"], [/\bredshift\b/, "aws:redshift"], [/\bathena\b/, "aws:athena"], [/\bbedrock\b/, "aws:bedrock"],
  [/\belasticache\b/, "aws:elasticache"], [/\baws\b.*\bapi ?gateway\b|\bapi ?gateway\b.*\baws\b/, "aws:apigateway"],
  [/\bbig ?query\b/, "gcp:bigquery"], [/\bgcs\b|\bcloud storage\b/, "gcp:gcs"], [/\bpub ?\/? ?sub\b/, "gcp:pubsub"], [/\bcloud ?run\b/, "gcp:cloudrun"],
  [/\bgke\b/, "gcp:gke"], [/\bcloud ?sql\b/, "gcp:cloudsql"], [/\bfirestore\b/, "gcp:firestore"], [/\bspanner\b/, "gcp:spanner"],
  [/\bdataflow\b/, "gcp:dataflow"], [/\bvertex\b/, "gcp:vertexai"],
  [/\baks\b/, "azure:aks"], [/\bcosmos ?db\b/, "azure:cosmosdb"], [/\bservice ?bus\b/, "azure:servicebus"], [/\bkey ?vault\b/, "azure:keyvault"],
  [/\bevent ?hubs?\b/, "azure:eventhubs"], [/\bazure\b.*\bblob\b|\bblob storage\b/, "azure:blob"],
  [/\bcron ?jobs?\b/, "k8s:cronjob"], [/\bconfig ?maps?\b/, "k8s:configmap"], [/\bnetwork ?polic(y|ies)\b/, "k8s:networkpolicy"],
  [/\bstateful ?sets?\b/, "k8s:statefulset"], [/\bdaemon ?sets?\b/, "k8s:daemonset"], [/\bpods?\b/, "k8s:pod"], [/\bingress\b/, "k8s:ingress"],
  [/\bnamespace\b/, "k8s:namespace"], [/\b(kubernetes|k8s)\b/, "k8s:pod"],
  [/\b(llm|gpt|openai|claude|ai model)\b/, "ai"], [/\b(payments?|stripe|billing|checkout)\b/, "payment"],
  [/\b(e-?mail|smtp|mail)\b/, "email"], [/\b(slack|chat|notifications?|line oa|sms)\b/, "chat"], [/\bdns\b/, "dns"], [/\bcdn\b/, "cdn"],
  [/\b(load ?balancer|lb)\b/, "loadbalancer"], [/\b(gateway|proxy|nginx|envoy)\b/, "gateway"],
  [/\b(firewall|waf|polic(y|ies)|middleware|guard)\b/, "shield"], [/\b(auth\w*|login|sign ?in|sso|oauth|oidc|jwt|sessions?)\b/, "login"],
  [/\b(secrets?|passwords?|credentials?)\b|รหัสผ่าน/, "secret"], [/\b(keys?|tokens?|api ?key|certs?|certificates?|tls)\b/, "key"],
  [/\b(config|configuration|settings|env|\.env)\b/, "config"], [/\b(warehouse|snowflake|data ?lake|lakehouse|databricks)\b/, "warehouse"],
  [/\b(postgres(ql)?|mysql|mariadb|mongo(db)?|oracle|sql ?server|sqlite|database|db)\b|ฐานข้อมูล/, "database"],
  [/\b(redis|memcached|cache)\b/, "cache"], [/\b(kafka|streams?|streaming)\b/, "stream"], [/\b(rabbitmq|queues?|mq)\b/, "queue"],
  [/\b(topics?|event ?bus|events?)\b/, "topic"], [/\b(buckets?|object storage|minio|blob)\b/, "bucket"],
  [/\b(registry|images?|docker ?hub|harbor)\b/, "registry"], [/\b(git|github|gitlab|bitbucket|repo|repository|commits?|pr|merge request)\b/, "git"],
  [/\b(ci|cd|ci\/cd|pipelines?|jenkins|argo ?cd|argo|flux|gitops|builds?|deploy\w*)\b/, "ci"], [/\b(cron|schedule\w*|nightly|timer)\b/, "clock"],
  [/\b(jobs?|workers?|batch|tasks?|consumer)\b/, "job"], [/\b(functions?|handlers?)\b/, "function"], [/\b(containers?|docker)\b/, "container"],
  [/\b(logs?|logging|audit)\b/, "log"], [/\b(monitor\w*|metrics|grafana|prometheus|alerts?|dashboard)\b/, "monitor"],
  [/\b(search|elasticsearch|opensearch)\b/, "search"], [/\b(cli|terminal|shell)\b/, "terminal"],
  [/\b(csv|json|yaml|xml|manifests?|files?|report)\b|ไฟล์/, "file"], [/\b(folder|volume|disk|pvc|directory)\b/, "folder"],
  [/\b(tables?|sheet|spreadsheet)\b/, "table"], [/\b(webhooks?|integration|plugin|connector)\b/, "plug"],
  [/\b(workflow|orchestrat\w*|airflow)\b/, "workflow"], [/\b(api|endpoint|rest|graphql|grpc|routes?|controller)\b/, "api"],
  [/\b(browser|web ?app|frontend|front-end|website|web|ui|page)\b/, "browser"], [/\b(mobile|ios|android)\b/, "mobile"],
  [/\b(server|backend|back-end|service|services|vm)\b/, "server"], [/\b(internet|network|vpc|egress|outbound)\b/, "network"],
  [/\b(users?|customers?|clients?|admins?|people)\b|ผู้ใช้|ลูกค้า/, "user"], [/\bcloud\b/, "cloud"], [/\b(code|source|library|sdk|module)\b/, "code"],
];

const words = (s) => String(s ?? "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_]/g, " ").toLowerCase();

function parse(name) {
  const [a, b] = String(name).toLowerCase().split(":");
  if (b == null) return GLYPHS[a] ? {glyph: a} : null;
  const glyph = SERVICES[a]?.[b.replace(/[\s_-]/g, "")] ?? (GLYPHS[b] ? b : null);
  return {glyph: glyph ?? "cloud", family: FAMILIES[a] ? a : null};
}

// {glyph, family} for a box, or null. `icon` wins ("none" turns it off); otherwise guessed from the name and id.
// `family` is the picture's own provider (a box inside a Kubernetes namespace is a Kubernetes object).
export function iconOf(node, id = "", family = null) {
  if (node?.icon === "none") return null;
  if (typeof node?.icon === "string" && node.icon) return parse(node.icon);
  const text = `${String(node?.name ?? "").toLowerCase()} ${words(id)}`;
  const hit = GUESS.find(([re]) => re.test(text));
  if (!hit) return null;
  const r = parse(hit[1]);
  return r.family ? r : {...r, family};
}

export const knownIcon = (name) => name === "none" || !!parse(name)?.glyph && (!String(name).includes(":") || !!FAMILIES[String(name).split(":")[0].toLowerCase()]);

export const iconNames = () => [...Object.keys(GLYPHS), ...Object.entries(SERVICES).flatMap(([f, s]) => Object.keys(s).map((k) => `${f}:${k}`))];
