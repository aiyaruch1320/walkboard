# Kubernetes

This page lists every Kubernetes kind that Walkboard knows: the boxes, zones and lines you can draw on a [map](../pictures/map.md), and where each one usually sits.

When a box has one of these kinds, the map shows its icon and fields. If you put it somewhere other than the zones listed under "Usually in", a small amber ⚠ appears next to its name. It is only a hint, so if you mean it, that is fine. To learn how kinds work, see [Platforms](README.md).

![A small web app with a database and a job, drawn with Kubernetes kinds](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/platforms/k8s.png)

[Open this map in the live example and click a box to see its kind ↗](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=k8s&step=all)

## Zones

A zone is a frame that holds boxes and other zones.

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="cluster"></a>**Cluster** `k8s:cluster` | anywhere |  | kubernetes, k8s | version |
| <a id="namespace"></a>**Namespace** `k8s:namespace` | [Cluster](#cluster) |  | ns |  |
| <a id="networkpolicy"></a>**Network policy** `k8s:networkpolicy` | [Namespace](#namespace) | a box inside it is checked against the zone around it | policy, firewall | rules |
| <a id="nodepool"></a>**Node pool** `k8s:nodepool` | [Cluster](#cluster) |  | node group, nodes | size; machine |
| <a id="mesh"></a>**Service mesh** `k8s:mesh` | [Cluster](#cluster), [Namespace](#namespace) | a box inside it is checked against the zone around it | istio, linkerd, mesh |  |

## Boxes

A box is one resource, such as a server, a database or a queue.

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="deployment"></a>**Deployment** `k8s:deployment` | [Namespace](#namespace) |  | pod, app | replicas; image; containers |
| <a id="statefulset"></a>**StatefulSet** `k8s:statefulset` | [Namespace](#namespace) |  |  | replicas; image; containers |
| <a id="daemonset"></a>**DaemonSet** `k8s:daemonset` | [Namespace](#namespace), [Node](#node), [Node pool](#nodepool) |  |  | image; containers |
| <a id="cronjob"></a>**CronJob** `k8s:cronjob` | [Namespace](#namespace) |  |  | schedule; image; containers; suspended (yes, no) |
| <a id="job"></a>**Job** `k8s:job` | [Namespace](#namespace) |  |  | image; containers |
| <a id="pod"></a>**Pod** `k8s:pod` | [Namespace](#namespace), [Node](#node), [Node pool](#nodepool) |  |  | image; containers |
| <a id="service"></a>**Service** `k8s:service` | [Namespace](#namespace) |  | svc | type (ClusterIP, NodePort, LoadBalancer, ExternalName, Headless); port |
| <a id="ingress"></a>**Ingress** `k8s:ingress` | [Namespace](#namespace) |  |  | host |
| <a id="configmap"></a>**ConfigMap** `k8s:configmap` | [Namespace](#namespace) |  | config |  |
| <a id="secret"></a>**Secret** `k8s:secret` | [Namespace](#namespace) |  | password |  |
| <a id="pvc"></a>**PersistentVolumeClaim** `k8s:pvc` | [Namespace](#namespace) |  | volume, disk | size; storageClass |
| <a id="pv"></a>**PersistentVolume** `k8s:pv` | [Cluster](#cluster) |  | volume, disk | size |
| <a id="hpa"></a>**HorizontalPodAutoscaler** `k8s:hpa` | [Namespace](#namespace) |  | autoscale | min; max |
| <a id="serviceaccount"></a>**ServiceAccount** `k8s:serviceaccount` | [Namespace](#namespace) |  |  |  |
| <a id="role"></a>**Role / RoleBinding** `k8s:role` | [Namespace](#namespace) |  | rbac |  |
| <a id="node"></a>**Node** `k8s:node` | [Cluster](#cluster), [Node pool](#nodepool) | a box, or a zone when something runs inside it | worker, machine | machine |
| <a id="replicaset"></a>**ReplicaSet** `k8s:replicaset` | [Namespace](#namespace) |  |  | replicas |
| <a id="operator"></a>**Operator / controller** `k8s:operator` | [Namespace](#namespace) |  | controller, crd |  |
| <a id="gateway"></a>**Gateway (Gateway API)** `k8s:gateway` | [Namespace](#namespace) |  | gateway api, load balancer | class; listeners |
| <a id="route"></a>**Route (HTTPRoute, GRPCRoute…)** `k8s:route` | [Namespace](#namespace) |  | httproute, grpcroute, tlsroute | type (HTTP, GRPC, TLS, TCP); host |
| <a id="pdb"></a>**PodDisruptionBudget** `k8s:pdb` | [Namespace](#namespace) |  | disruption | minAvailable |
| <a id="vpa"></a>**VerticalPodAutoscaler** `k8s:vpa` | [Namespace](#namespace) |  | autoscale |  |
| <a id="scaledobject"></a>**ScaledObject (KEDA)** `k8s:scaledobject` | [Namespace](#namespace) |  | keda, autoscale, event scaling | trigger |
| <a id="resourcequota"></a>**ResourceQuota / LimitRange** `k8s:resourcequota` | [Namespace](#namespace) |  | limits, quota |  |
| <a id="storageclass"></a>**StorageClass** `k8s:storageclass` | [Cluster](#cluster) |  | storage, csi | provisioner |
| <a id="clusterrole"></a>**ClusterRole / ClusterRoleBinding** `k8s:clusterrole` | [Cluster](#cluster) |  | rbac |  |
| <a id="crd"></a>**CustomResourceDefinition** `k8s:crd` | [Cluster](#cluster) |  | custom resource |  |
| <a id="certificate"></a>**Certificate (cert-manager)** `k8s:certificate` | [Namespace](#namespace) |  | cert-manager, tls |  |
| <a id="externalsecret"></a>**ExternalSecret** `k8s:externalsecret` | [Namespace](#namespace) |  | external secrets, vault, secret store |  |
| <a id="gitopsapp"></a>**GitOps app (Argo CD / Flux)** `k8s:gitopsapp` | [Namespace](#namespace), [Cluster](#cluster) |  | argo cd, argocd, flux, gitops |  |

## Lines

A line without a kind is plain traffic, one part calling another. These kinds are for lines that mean something else.

| Kind | Means |
|---|---|
| <a id="line-uses"></a>`k8s:uses` | Reads config or secret |
| <a id="line-mounts"></a>`k8s:mounts` | Mounts a volume |
| <a id="line-selects"></a>`k8s:selects` | Selects pods |
| <a id="line-routes"></a>`k8s:routes` | Routes to |
| <a id="line-scales"></a>`k8s:scales` | Scales |

> **Good to know:** This page is generated from `skills/walkboard/lib/profiles.mjs`. To add a kind, change that file and run `node scripts/profiles-doc.mjs`.
