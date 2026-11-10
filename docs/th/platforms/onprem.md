# On-prem

หน้านี้รวม kind ทั้งหมดของ On-prem ที่ Walkboard รู้จัก คือกล่อง โซน และเส้นที่วาดบน[ภาพระบบ (map)](../pictures/map.md) ได้ และบอกว่าแต่ละอย่างมักอยู่ตรงไหน

ถ้ากล่องมี kind จากหน้านี้ ภาพจะแสดงไอคอนและช่องข้อมูลของมัน ถ้าวางไว้นอกโซนที่อยู่ในคอลัมน์ "มักอยู่ใน" จะมีป้าย ⚠ เล็กๆ ขึ้นข้างชื่อ เป็นแค่คำเตือน ถ้าตั้งใจวางแบบนั้นก็ไม่เป็นไร อ่านว่า kind ทำงานยังไงได้ที่หน้า[แพลตฟอร์ม](README.md)

![เว็บแอปเล็กๆ ที่มีฐานข้อมูลและ job วาดด้วย kind ของ On-prem](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/platforms/onprem.png)

[เปิดภาพนี้ในตัวอย่างที่ลองได้ แล้วคลิกกล่องเพื่อดู kind ของมัน ↗](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=onprem&step=all)

## โซน (zone)

โซนคือกรอบที่มีกล่องหรือโซนอื่นอยู่ข้างใน

| Kind | มักอยู่ใน | หมายเหตุ | ชื่ออื่น | ช่องข้อมูล |
|---|---|---|---|---|
| <a id="datacenter"></a>**Data center** `onprem:datacenter` | ที่ไหนก็ได้ |  |  |  |
| <a id="rack"></a>**Rack** `onprem:rack` | [Data center](#datacenter) |  |  |  |
| <a id="vlan"></a>**VLAN / network segment** `onprem:vlan` | [Data center](#datacenter), [DMZ](#dmz), [Site / office / branch](#site) |  | network, segment, subnet | id; cidr |
| <a id="dmz"></a>**DMZ** `onprem:dmz` | [Data center](#datacenter), [Site / office / branch](#site) |  |  |  |
| <a id="site"></a>**Site / office / branch** `onprem:site` | ที่ไหนก็ได้ |  | office, branch, campus, headquarters |  |
| <a id="cluster"></a>**Virtualization cluster** `onprem:cluster` | [Data center](#datacenter), [Rack](#rack), [VLAN / network segment](#vlan) | มี [Container](container.md) อยู่ข้างในได้ | vsphere, vcenter, proxmox, hyper-v, nutanix |  |

## กล่อง (box)

กล่องคือทรัพยากรหนึ่งชิ้น เช่น server ฐานข้อมูล หรือ queue

| Kind | มักอยู่ใน | หมายเหตุ | ชื่ออื่น | ช่องข้อมูล |
|---|---|---|---|---|
| <a id="server"></a>**Physical server** `onprem:server` | [Rack](#rack), [Data center](#datacenter), [VLAN / network segment](#vlan), [DMZ](#dmz), [Site / office / branch](#site) | เป็นกล่อง หรือเป็นโซนเมื่อมีอะไรรันอยู่ข้างใน; มี [Container](container.md), [Kubernetes](k8s.md) อยู่ข้างในได้ | host, machine, bare metal | cpu; memory; os |
| <a id="vm"></a>**Virtual machine** `onprem:vm` | [Physical server](#server), [VLAN / network segment](#vlan), [Data center](#datacenter), [DMZ](#dmz), [Virtualization cluster](#cluster), [Hypervisor host](#hypervisor) | เป็นกล่อง หรือเป็นโซนเมื่อมีอะไรรันอยู่ข้างใน; มี [Container](container.md), [Kubernetes](k8s.md) อยู่ข้างในได้ | server, vmware | cpu; memory; os |
| <a id="firewall"></a>**Firewall** `onprem:firewall` | [Data center](#datacenter), [Rack](#rack), [DMZ](#dmz), [VLAN / network segment](#vlan), [Site / office / branch](#site) |  |  | model |
| <a id="router"></a>**Router** `onprem:router` | [Data center](#datacenter), [Rack](#rack), [Site / office / branch](#site) |  |  |  |
| <a id="switch"></a>**Switch** `onprem:switch` | [Data center](#datacenter), [Rack](#rack), [VLAN / network segment](#vlan), [Site / office / branch](#site) |  |  |  |
| <a id="loadbalancer"></a>**Load balancer** `onprem:loadbalancer` | [Data center](#datacenter), [Rack](#rack), [DMZ](#dmz), [VLAN / network segment](#vlan) |  | lb, f5 | model |
| <a id="vpn"></a>**VPN gateway** `onprem:vpn` | [Data center](#datacenter), [DMZ](#dmz), [Site / office / branch](#site) |  |  |  |
| <a id="database"></a>**Database** `onprem:database` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter) |  | db, oracle, postgres, mysql, sql server | engine |
| <a id="storage"></a>**Storage (NAS / SAN)** `onprem:storage` | [Data center](#datacenter), [Rack](#rack), [VLAN / network segment](#vlan) |  | nas, san, disk | size |
| <a id="directory"></a>**Directory (AD / LDAP)** `onprem:directory` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter) |  | ad, ldap, active directory |  |
| <a id="hypervisor"></a>**Hypervisor host** `onprem:hypervisor` | [Rack](#rack), [Data center](#datacenter), [Virtualization cluster](#cluster), [VLAN / network segment](#vlan) | เป็นกล่อง หรือเป็นโซนเมื่อมีอะไรรันอยู่ข้างใน; มี [Container](container.md) อยู่ข้างในได้ | esxi, proxmox, hyper-v, kvm | cpu; memory |
| <a id="appserver"></a>**Application server** `onprem:appserver` | [Physical server](#server), [Virtual machine](#vm), [VLAN / network segment](#vlan), [Data center](#datacenter), [DMZ](#dmz) | เป็นกล่อง หรือเป็นโซนเมื่อมีอะไรรันอยู่ข้างใน; มี [Container](container.md) อยู่ข้างในได้ | tomcat, weblogic, websphere, jboss, iis, middleware | platform |
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

## เส้น (line)

เส้นที่ไม่มี kind คือ traffic ธรรมดา คือส่วนหนึ่งเรียกอีกส่วน kind ด้านล่างใช้กับเส้นที่หมายถึงอย่างอื่น

| Kind | หมายถึง |
|---|---|
| <a id="line-replication"></a>`onprem:replication` | Replication |
| <a id="line-backup"></a>`onprem:backup` | Backup |
| <a id="line-wan"></a>`onprem:wan` | WAN / VPN link |

> **ควรรู้:** หน้านี้สร้างอัตโนมัติจาก `skills/walkboard/lib/profiles.mjs` ถ้าจะเพิ่ม kind ให้แก้ไฟล์นั้น แล้วรัน `node scripts/profiles-doc.mjs`
