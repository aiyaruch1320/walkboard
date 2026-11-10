# Kubernetes

หน้านี้รวม kind ทั้งหมดของ Kubernetes ที่ Walkboard รู้จัก คือ box, zone และ line ที่วาดบน [map](../pictures/map.md) ได้ และบอกว่าแต่ละอย่างมักอยู่ตรงไหน

ถ้า box มี kind จากหน้านี้ map จะแสดง icon และ field ของมัน ถ้าวางไว้นอก zone ที่อยู่ในคอลัมน์ "มักอยู่ใน" จะมีป้าย ⚠ เล็กๆ ขึ้นข้างชื่อ เป็นแค่คำเตือน ถ้าตั้งใจวางแบบนั้นก็ไม่เป็นไร อ่านว่า kind ทำงานยังไงได้ที่หน้า[แพลตฟอร์ม](README.md)

![web app เล็กๆ ที่มี database และ job วาดด้วย kind ของ Kubernetes](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/platforms/k8s.png)

[เปิด map นี้ใน live example แล้วคลิก box เพื่อดู kind ของมัน ↗](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=k8s&step=all)

## Zone

zone คือกรอบที่มี box หรือ zone อื่นอยู่ข้างใน

| Kind | มักอยู่ใน | หมายเหตุ | ชื่ออื่น | Field |
|---|---|---|---|---|
| <a id="cluster"></a>**Cluster** `k8s:cluster` | ที่ไหนก็ได้ |  | kubernetes, k8s | version |
| <a id="namespace"></a>**Namespace** `k8s:namespace` | [Cluster](#cluster) |  | ns |  |
| <a id="networkpolicy"></a>**Network policy** `k8s:networkpolicy` | [Namespace](#namespace) | box ข้างในจะถูกเช็กกับ zone ที่ครอบมันอีกชั้น | policy, firewall | rules |
| <a id="nodepool"></a>**Node pool** `k8s:nodepool` | [Cluster](#cluster) |  | node group, nodes | size; machine |
| <a id="mesh"></a>**Service mesh** `k8s:mesh` | [Cluster](#cluster), [Namespace](#namespace) | box ข้างในจะถูกเช็กกับ zone ที่ครอบมันอีกชั้น | istio, linkerd, mesh |  |

## Box

box คือ resource หนึ่งตัว เช่น server, database หรือ queue

| Kind | มักอยู่ใน | หมายเหตุ | ชื่ออื่น | Field |
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
| <a id="node"></a>**Node** `k8s:node` | [Cluster](#cluster), [Node pool](#nodepool) | เป็น box หรือเป็น zone เมื่อมีอะไรรันอยู่ข้างใน | worker, machine | machine |
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

## Line

line ที่ไม่มี kind คือ traffic ธรรมดา ส่วนหนึ่งเรียกอีกส่วน kind ด้านล่างใช้กับ line ที่หมายถึงอย่างอื่น

| Kind | หมายถึง |
|---|---|
| <a id="line-uses"></a>`k8s:uses` | Reads config or secret |
| <a id="line-mounts"></a>`k8s:mounts` | Mounts a volume |
| <a id="line-selects"></a>`k8s:selects` | Selects pods |
| <a id="line-routes"></a>`k8s:routes` | Routes to |
| <a id="line-scales"></a>`k8s:scales` | Scales |

> **ควรรู้:** หน้านี้สร้างอัตโนมัติจาก `skills/walkboard/lib/profiles.mjs` ถ้าจะเพิ่ม kind ให้แก้ไฟล์นั้น แล้วรัน `node scripts/profiles-doc.mjs`
