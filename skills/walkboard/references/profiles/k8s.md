# k8s (Kubernetes)

Each line: kind and name; `zone` or `also zone` (else a box); in = where it usually sits; props. How to use them: views/map.md.

- `k8s:cluster` Cluster · zone · version
- `k8s:namespace` Namespace · zone · in Cluster
- `k8s:networkpolicy` Network policy · zone (rules look through it) · in Namespace · rules
- `k8s:deployment` Deployment · in Namespace · replicas; image; containers
- `k8s:statefulset` StatefulSet · in Namespace · replicas; image; containers
- `k8s:daemonset` DaemonSet · in Namespace, Node, Node pool · image; containers
- `k8s:cronjob` CronJob · in Namespace · schedule; image; containers; suspended: yes / no
- `k8s:job` Job · in Namespace · image; containers
- `k8s:pod` Pod · in Namespace, Node, Node pool · image; containers
- `k8s:service` Service · in Namespace · type: ClusterIP / NodePort / LoadBalancer / ExternalName / Headless; port
- `k8s:ingress` Ingress · in Namespace · host
- `k8s:configmap` ConfigMap · in Namespace
- `k8s:secret` Secret · in Namespace
- `k8s:pvc` PersistentVolumeClaim · in Namespace · size; storageClass
- `k8s:pv` PersistentVolume · in Cluster · size
- `k8s:hpa` HorizontalPodAutoscaler · in Namespace · min; max
- `k8s:serviceaccount` ServiceAccount · in Namespace
- `k8s:role` Role / RoleBinding · in Namespace
- `k8s:nodepool` Node pool · zone · in Cluster · size; machine
- `k8s:node` Node · also zone · in Cluster, Node pool · machine
- `k8s:mesh` Service mesh · zone (rules look through it) · in Cluster, Namespace
- `k8s:replicaset` ReplicaSet · in Namespace · replicas
- `k8s:operator` Operator / controller · in Namespace
- `k8s:gateway` Gateway (Gateway API) · in Namespace · class; listeners
- `k8s:route` Route (HTTPRoute, GRPCRoute…) · in Namespace · type: HTTP / GRPC / TLS / TCP; host
- `k8s:pdb` PodDisruptionBudget · in Namespace · minAvailable
- `k8s:vpa` VerticalPodAutoscaler · in Namespace
- `k8s:scaledobject` ScaledObject (KEDA) · in Namespace · trigger
- `k8s:resourcequota` ResourceQuota / LimitRange · in Namespace
- `k8s:storageclass` StorageClass · in Cluster · provisioner
- `k8s:clusterrole` ClusterRole / ClusterRoleBinding · in Cluster
- `k8s:crd` CustomResourceDefinition · in Cluster
- `k8s:certificate` Certificate (cert-manager) · in Namespace
- `k8s:externalsecret` ExternalSecret · in Namespace
- `k8s:gitopsapp` GitOps app (Argo CD / Flux) · in Namespace, Cluster

Lines: `k8s:uses` Reads config or secret, `k8s:mounts` Mounts a volume, `k8s:selects` Selects pods, `k8s:routes` Routes to, `k8s:scales` Scales; without a kind a line is traffic.
