# On-prem

[Docs](../README.md) › [Platforms](README.md) › On-prem

What boxes, zones and lines can be on On-prem, and where each usually sits. On a map the page draws a kind's icon and fields, and shows a small amber ⚠ when something sits outside the zones listed here. That is a hint, never a block: if you mean it, it is fine. How profiles work: [Platforms](README.md).

![A small web app with a database and a job, drawn with On-prem kinds](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/platforms/onprem.png)

[Try it: click a box, see its kind and fields ↗](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=onprem&step=all)

This page is generated from `skills/walkboard/lib/profiles.mjs`.

## Zones

Frames that hold other things.

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="datacenter"></a>**Data center** `onprem:datacenter` | anywhere |  |  |  |
| <a id="rack"></a>**Rack** `onprem:rack` | [Data center](#datacenter) |  |  |  |
| <a id="vlan"></a>**VLAN / network segment** `onprem:vlan` | [Data center](#datacenter), [DMZ](#dmz), [Site / office / branch](#site) |  | network, segment, subnet | id; cidr |
| <a id="dmz"></a>**DMZ** `onprem:dmz` | [Data center](#datacenter), [Site / office / branch](#site) |  |  |  |
| <a id="site"></a>**Site / office / branch** `onprem:site` | anywhere |  | office, branch, campus, headquarters |  |
| <a id="cluster"></a>**Virtualization cluster** `onprem:cluster` | [Data center](#datacenter), [Rack](#rack), [VLAN / network segment](#vlan) | can run [Container](container.md) inside | vsphere, vcenter, proxmox, hyper-v, nutanix |  |

## Boxes

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="server"></a>**Physical server** `onprem:server` | [Rack](#rack), [Data center](#datacenter), [VLAN / network segment](#vlan), [DMZ](#dmz), [Site / office / branch](#site) | a box, or a zone when something runs inside it; can run [Container](container.md), [Kubernetes](k8s.md) inside | host, machine, bare metal | cpu; memory; os |
| <a id="vm"></a>**Virtual machine** `onprem:vm` | [Physical server](#server), [VLAN / network segment](#vlan), [Data center](#datacenter), [DMZ](#dmz), [Virtualization cluster](#cluster), [Hypervisor host](#hypervisor) | a box, or a zone when something runs inside it; can run [Container](container.md), [Kubernetes](k8s.md) inside | server, vmware | cpu; memory; os |
| <a id="firewall"></a>**Firewall** `onprem:firewall` | [Data center](#datacenter), [Rack](#rack), [DMZ](#dmz), [VLAN / network segment](#vlan), [Site / office / branch](#site) |  |  | model |
| <a id="router"></a>**Router** `onprem:router` | [Data center](#datacenter), [Rack](#rack), [Site / office / branch](#site) |  |  |  |
| <a id="switch"></a>**Switch** `onprem:switch` | [Data center](#datacenter), [Rack](#rack), [VLAN / network segment](#vlan), [Site / office / branch](#site) |  |  |  |
| <a id="loadbalancer"></a>**Load balancer** `onprem:loadbalancer` | [Data center](#datacenter), [Rack](#rack), [DMZ](#dmz), [VLAN / network segment](#vlan) |  | lb, f5 | model |
| <a id="vpn"></a>**VPN gateway** `onprem:vpn` | [Data center](#datacenter), [DMZ](#dmz), [Site / office / branch](#site) |  |  |  |
| <a id="database"></a>**Database** `onprem:database` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter) |  | db, oracle, postgres, mysql, sql server | engine |
| <a id="storage"></a>**Storage (NAS / SAN)** `onprem:storage` | [Data center](#datacenter), [Rack](#rack), [VLAN / network segment](#vlan) |  | nas, san, disk | size |
| <a id="directory"></a>**Directory (AD / LDAP)** `onprem:directory` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter) |  | ad, ldap, active directory |  |
| <a id="hypervisor"></a>**Hypervisor host** `onprem:hypervisor` | [Rack](#rack), [Data center](#datacenter), [Virtualization cluster](#cluster), [VLAN / network segment](#vlan) | a box, or a zone when something runs inside it; can run [Container](container.md) inside | esxi, proxmox, hyper-v, kvm | cpu; memory |
| <a id="appserver"></a>**Application server** `onprem:appserver` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter), [DMZ](#dmz) | a box, or a zone when something runs inside it; can run [Container](container.md) inside | tomcat, weblogic, websphere, jboss, iis, middleware | platform |
| <a id="proxy"></a>**Proxy (forward / reverse)** `onprem:proxy` | [DMZ](#dmz), [VLAN / network segment](#vlan), [Data center](#datacenter), [Physical server](#server), [Virtual machine](#vm) |  | reverse proxy, nginx, haproxy, squid |  |
| <a id="waf"></a>**Web application firewall** `onprem:waf` | [DMZ](#dmz), [Data center](#datacenter), [Rack](#rack), [VLAN / network segment](#vlan) |  | waf |  |
| <a id="ids"></a>**IDS / IPS** `onprem:ids` | [Data center](#datacenter), [Rack](#rack), [DMZ](#dmz), [VLAN / network segment](#vlan) |  | intrusion detection, intrusion prevention |  |
| <a id="dnsserver"></a>**DNS / DHCP server** `onprem:dnsserver` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter), [DMZ](#dmz) |  | dns, dhcp, bind |  |
| <a id="mailserver"></a>**Mail server** `onprem:mailserver` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter), [DMZ](#dmz) |  | smtp, exchange, email |  |
| <a id="fileserver"></a>**File server** `onprem:fileserver` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter) |  | smb, nfs, file share |  |
| <a id="objectstorage"></a>**Object storage** `onprem:objectstorage` | [Data center](#datacenter), [Rack](#rack), [VLAN / network segment](#vlan), [Physical server](#server), [Virtual machine](#vm) |  | minio, ceph, s3 compatible, bucket |  |
| <a id="backupserver"></a>**Backup server / tape** `onprem:backupserver` | [Data center](#datacenter), [Rack](#rack), [VLAN / network segment](#vlan) |  | backup, veeam, tape |  |
| <a id="cache"></a>**Cache** `onprem:cache` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter) |  | redis, memcached |  |
| <a id="mq"></a>**Message queue** `onprem:mq` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter) |  | ibm mq, rabbitmq, kafka, activemq, queue |  |
| <a id="mainframe"></a>**Mainframe** `onprem:mainframe` | [Data center](#datacenter), [Rack](#rack) |  | ibm z, as/400, cobol |  |
| <a id="siem"></a>**SIEM / log server** `onprem:siem` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter) |  | syslog, splunk, qradar, elk, logs |  |
| <a id="monitoring"></a>**Monitoring** `onprem:monitoring` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter) |  | zabbix, nagios, prometheus, grafana |  |
| <a id="bastion"></a>**Jump host / PAM** `onprem:bastion` | [VLAN / network segment](#vlan), [DMZ](#dmz), [Data center](#datacenter), [Physical server](#server), [Virtual machine](#vm) |  | bastion, pam, cyberark |  |
| <a id="hsm"></a>**HSM** `onprem:hsm` | [Data center](#datacenter), [Rack](#rack) |  | hardware security module, keys |  |
| <a id="cicd"></a>**CI/CD server** `onprem:cicd` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter) |  | jenkins, gitlab, ci, build |  |
| <a id="accesspoint"></a>**Wi-Fi access point** `onprem:accesspoint` | [Site / office / branch](#site), [VLAN / network segment](#vlan) |  | wifi, wireless, ap |  |

## Lines

A line without a kind is traffic: one part calling another.

| Kind | Means |
|---|---|
| <a id="line-replication"></a>`onprem:replication` | Replication |
| <a id="line-backup"></a>`onprem:backup` | Backup |
| <a id="line-wan"></a>`onprem:wan` | WAN / VPN link |
