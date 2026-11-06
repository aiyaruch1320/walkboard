# onprem (On-prem)

Each line: kind and name; `zone` or `also zone` (else a box); in = where it usually sits; props. How to use them: views/map.md.

- `onprem:datacenter` Data center · zone
- `onprem:rack` Rack · zone · in Data center
- `onprem:vlan` VLAN / network segment · zone · in Data center, DMZ, Site / office / branch · id; cidr
- `onprem:dmz` DMZ · zone · in Data center, Site / office / branch
- `onprem:server` Physical server · also zone · in Rack, Data center, VLAN / network segment, DMZ, Site / office / branch · cpu; memory; os
- `onprem:vm` Virtual machine · also zone · in Physical server, VLAN / network segment, Data center, DMZ, Virtualization cluster, Hypervisor host · cpu; memory; os
- `onprem:firewall` Firewall · in Data center, Rack, DMZ, VLAN / network segment, Site / office / branch · model
- `onprem:router` Router · in Data center, Rack, Site / office / branch
- `onprem:switch` Switch · in Data center, Rack, VLAN / network segment, Site / office / branch
- `onprem:loadbalancer` Load balancer · in Data center, Rack, DMZ, VLAN / network segment · model
- `onprem:vpn` VPN gateway · in Data center, DMZ, Site / office / branch
- `onprem:database` Database · in Physical server, Virtual machine, VLAN / network segment, Data center · engine
- `onprem:storage` Storage (NAS / SAN) · in Data center, Rack, VLAN / network segment · size
- `onprem:directory` Directory (AD / LDAP) · in Physical server, Virtual machine, VLAN / network segment, Data center
- `onprem:site` Site / office / branch · zone
- `onprem:cluster` Virtualization cluster · zone · in Data center, Rack, VLAN / network segment
- `onprem:hypervisor` Hypervisor host · also zone · in Rack, Data center, Virtualization cluster, VLAN / network segment · cpu; memory
- `onprem:appserver` Application server · also zone · in Physical server, Virtual machine, VLAN / network segment, Data center, DMZ · platform
- `onprem:proxy` Proxy (forward / reverse) · in DMZ, VLAN / network segment, Data center, Physical server, Virtual machine
- `onprem:waf` Web application firewall · in DMZ, Data center, Rack, VLAN / network segment
- `onprem:ids` IDS / IPS · in Data center, Rack, DMZ, VLAN / network segment
- `onprem:dnsserver` DNS / DHCP server · in Physical server, Virtual machine, VLAN / network segment, Data center, DMZ
- `onprem:mailserver` Mail server · in Physical server, Virtual machine, VLAN / network segment, Data center, DMZ
- `onprem:fileserver` File server · in Physical server, Virtual machine, VLAN / network segment, Data center
- `onprem:objectstorage` Object storage · in Data center, Rack, VLAN / network segment, Physical server, Virtual machine
- `onprem:backupserver` Backup server / tape · in Data center, Rack, VLAN / network segment
- `onprem:cache` Cache · in Physical server, Virtual machine, VLAN / network segment, Data center
- `onprem:mq` Message queue · in Physical server, Virtual machine, VLAN / network segment, Data center
- `onprem:mainframe` Mainframe · in Data center, Rack
- `onprem:siem` SIEM / log server · in Physical server, Virtual machine, VLAN / network segment, Data center
- `onprem:monitoring` Monitoring · in Physical server, Virtual machine, VLAN / network segment, Data center
- `onprem:bastion` Jump host / PAM · in VLAN / network segment, DMZ, Data center, Physical server, Virtual machine
- `onprem:hsm` HSM · in Data center, Rack
- `onprem:cicd` CI/CD server · in Physical server, Virtual machine, VLAN / network segment, Data center
- `onprem:accesspoint` Wi-Fi access point · in Site / office / branch, VLAN / network segment

Lines: `onprem:replication` Replication, `onprem:backup` Backup, `onprem:wan` WAN / VPN link; without a kind a line is traffic.
