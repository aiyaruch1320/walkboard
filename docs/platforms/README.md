# Platforms

[Docs](../README.md) › Platforms

On a [map](../pictures/map.md), a box, zone or line can say what it is on a platform: an RDS database in a private subnet, a CronJob in a namespace, a VLAN in a data centre. That is its **kind**, written like `aws:rds` or `k8s:cronjob`. A set of kinds for one platform is a **profile**.

| Profile | Covers |
|---|---|
| [AWS](aws.md) | accounts, regions, VPCs, Availability Zones, subnets, security groups, and AWS services |
| [Google Cloud](gcp.md) | organizations, folders, projects, VPC networks, regions, subnets, and Google Cloud services |
| [Azure](azure.md) | subscriptions, resource groups, virtual networks, subnets, and Azure services |
| [Huawei Cloud](huawei.md) | regions, enterprise projects, VPCs, subnets, and Huawei Cloud services |
| [Kubernetes](k8s.md) | clusters, node pools, namespaces, workloads, services, config and network policies |
| [Container](container.md) | container hosts, Compose projects, Swarm, Podman pods, containers and their networks |
| [On-prem](onprem.md) | data centres, sites, racks, VLANs, DMZs, servers, virtualization and appliances |

Each page lists every kind with where it usually sits, other names for it, and its fields.

## What a kind gives you

- **Its icon**, in the platform's colours, and its fields under the name (an RDS shows its engine and size).
- **A platform tag** on the picture, so a reader knows where they are.
- **A warning when something sits in an unusual place.** A small amber **⚠** appears beside the name. Point at it to read why ("RDS usually sits in Subnet, VPC"), and follow its link to the kind on the platform's page. It is a hint, never a block: drawing quickly is fine, and some designs mean it.

A zone without a kind says nothing about what is inside it, and anything no profile covers is drawn without a kind, as written.

## Mixing platforms

Profiles mix on one map. An EKS cluster in an AWS VPC is a Kubernetes cluster zone inside an AWS VPC zone, with namespaces and workloads in it. A box from one platform inside another platform's zone warns with both names ("a Google Cloud VM in an AWS subnet"), unless that zone can run it, such as containers on an EC2.

## In draft mode

In [draft mode](../draft.md), a box's or zone's card has a search for its kind. Kinds from the platform of the zone it is in come first, then from the zones around it, then from platforms the picture already uses.

## Something missing?

The profiles cover common parts from each provider's official product list, not all of them. [Open an issue](https://github.com/aiyaruch1320/walkboard/issues/new/choose) for a kind you need, or draw it without a kind meanwhile.
