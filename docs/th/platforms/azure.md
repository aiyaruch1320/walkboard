# Azure

หน้านี้รวม kind ทั้งหมดของ Azure ที่ Walkboard รู้จัก คือกล่อง โซน และเส้นที่วาดบน[ภาพระบบ (map)](../pictures/map.md) ได้ และบอกว่าแต่ละอย่างมักอยู่ตรงไหน

ถ้ากล่องมี kind จากหน้านี้ ภาพจะแสดงไอคอนและช่องข้อมูลของมัน ถ้าวางไว้นอกโซนที่อยู่ในคอลัมน์ "มักอยู่ใน" จะมีป้าย ⚠ เล็กๆ ขึ้นข้างชื่อ เป็นแค่คำเตือน ถ้าตั้งใจวางแบบนั้นก็ไม่เป็นไร อ่านว่า kind ทำงานยังไงได้ที่หน้า[แพลตฟอร์ม](README.md)

![เว็บแอปเล็กๆ ที่มีฐานข้อมูลและ job วาดด้วย kind ของ Azure](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/platforms/azure.png)

[เปิดภาพนี้ในตัวอย่างที่ลองได้ แล้วคลิกกล่องเพื่อดู kind ของมัน ↗](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=azure&step=all)

## โซน (zone)

โซนคือกรอบที่มีกล่องหรือโซนอื่นอยู่ข้างใน

| Kind | มักอยู่ใน | หมายเหตุ | ชื่ออื่น | ช่องข้อมูล |
|---|---|---|---|---|
| <a id="subscription"></a>**Subscription** `azure:subscription` | [Management group](#managementgroup) |  |  |  |
| <a id="managementgroup"></a>**Management group** `azure:managementgroup` | [Management group](#managementgroup) |  |  |  |
| <a id="resourcegroup"></a>**Resource group** `azure:resourcegroup` | [Subscription](#subscription) |  |  |  |
| <a id="region"></a>**Region** `azure:region` | [Subscription](#subscription), [Resource group](#resourcegroup) |  |  |  |
| <a id="vnet"></a>**Virtual network** `azure:vnet` | [Resource group](#resourcegroup), [Region](#region), [Subscription](#subscription) |  |  | cidr |
| <a id="availabilityzone"></a>**Availability Zone** `azure:availabilityzone` | [Region](#region), [Virtual network](#vnet) |  |  |  |
| <a id="subnet"></a>**Subnet** `azure:subnet` | [Virtual network](#vnet) |  |  | cidr |
| <a id="nsg"></a>**Network security group** `azure:nsg` | [Virtual network](#vnet), [Subnet](#subnet) | กล่องข้างในจะถูกเช็กกับโซนที่ครอบมันอีกชั้น | security group, firewall | rules |

## กล่อง (box)

กล่องคือทรัพยากรหนึ่งชิ้น เช่น server ฐานข้อมูล หรือ queue

| Kind | มักอยู่ใน | หมายเหตุ | ชื่ออื่น | ช่องข้อมูล |
|---|---|---|---|---|
| <a id="vm"></a>**Virtual machine** `azure:vm` | [Subnet](#subnet) | เป็นกล่อง หรือเป็นโซนเมื่อมีอะไรรันอยู่ข้างใน; มี [Container](container.md) อยู่ข้างในได้ | server, instance | size; os |
| <a id="aks"></a>**AKS cluster** `azure:aks` | [Virtual network](#vnet), [Subnet](#subnet), [Resource group](#resourcegroup) | เป็นกล่อง หรือเป็นโซนเมื่อมีอะไรรันอยู่ข้างใน; มี [Kubernetes](k8s.md) อยู่ข้างในได้ | kubernetes, k8s |  |
| <a id="appservice"></a>**App Service** `azure:appservice` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet) |  | web app | plan |
| <a id="functions"></a>**Functions** `azure:functions` | [Resource group](#resourcegroup), [Region](#region) |  | function, serverless | runtime |
| <a id="containerapps"></a>**Container Apps** `azure:containerapps` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet) |  | container |  |
| <a id="aci"></a>**Container Instances** `azure:aci` | [Resource group](#resourcegroup), [Subnet](#subnet) |  | container |  |
| <a id="logicapps"></a>**Logic Apps** `azure:logicapps` | [Resource group](#resourcegroup), [Region](#region) |  | workflow |  |
| <a id="appgateway"></a>**Application Gateway** `azure:appgateway` | [Subnet](#subnet), [Virtual network](#vnet) |  |  |  |
| <a id="loadbalancer"></a>**Load Balancer** `azure:loadbalancer` | [Subnet](#subnet), [Virtual network](#vnet), [Resource group](#resourcegroup) |  | lb | scheme (public, internal) |
| <a id="frontdoor"></a>**Front Door** `azure:frontdoor` | [Subscription](#subscription), [Resource group](#resourcegroup) |  |  |  |
| <a id="firewall"></a>**Azure Firewall** `azure:firewall` | [Subnet](#subnet), [Virtual network](#vnet) |  |  |  |
| <a id="privateendpoint"></a>**Private endpoint** `azure:privateendpoint` | [Subnet](#subnet) |  | private link |  |
| <a id="privatednszone"></a>**Private DNS zone** `azure:privatednszone` | [Resource group](#resourcegroup), [Virtual network](#vnet) |  | dns |  |
| <a id="bastion"></a>**Bastion** `azure:bastion` | [Subnet](#subnet), [Virtual network](#vnet) |  | jump host |  |
| <a id="natgateway"></a>**NAT Gateway** `azure:natgateway` | [Subnet](#subnet), [Virtual network](#vnet) |  | nat |  |
| <a id="vpngateway"></a>**VPN Gateway** `azure:vpngateway` | [Subnet](#subnet), [Virtual network](#vnet) |  |  |  |
| <a id="expressroute"></a>**ExpressRoute** `azure:expressroute` | [Resource group](#resourcegroup), [Region](#region), [Subscription](#subscription) |  |  |  |
| <a id="apim"></a>**API Management** `azure:apim` | [Resource group](#resourcegroup), [Subnet](#subnet) |  |  |  |
| <a id="sql"></a>**Azure SQL** `azure:sql` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  | db, database, sql server | tier |
| <a id="postgres"></a>**Database for PostgreSQL** `azure:postgres` | [Resource group](#resourcegroup), [Subnet](#subnet), [Region](#region) |  | db, database | tier |
| <a id="cosmosdb"></a>**Cosmos DB** `azure:cosmosdb` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  | db, nosql, mongodb | api (nosql, mongodb, cassandra, gremlin, table) |
| <a id="redis"></a>**Azure Managed Redis** `azure:redis` | [Resource group](#resourcegroup), [Subnet](#subnet), [Region](#region) |  | cache, azure cache for redis | tier |
| <a id="storage"></a>**Storage account** `azure:storage` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  | blob, bucket, object storage | kind (blob, files, queue, table) |
| <a id="servicebus"></a>**Service Bus** `azure:servicebus` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  | queue |  |
| <a id="eventhubs"></a>**Event Hubs** `azure:eventhubs` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  |  |  |
| <a id="eventgrid"></a>**Event Grid** `azure:eventgrid` | [Resource group](#resourcegroup), [Region](#region) |  |  |  |
| <a id="keyvault"></a>**Key Vault** `azure:keyvault` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  | secret, key |  |
| <a id="entra"></a>**Entra ID** `azure:entra` | [Subscription](#subscription) |  | login, identity, ad |  |
| <a id="managedidentity"></a>**Managed identity** `azure:managedidentity` | [Resource group](#resourcegroup), [Subscription](#subscription) |  | identity |  |
| <a id="monitor"></a>**Azure Monitor** `azure:monitor` | [Subscription](#subscription), [Resource group](#resourcegroup) |  |  |  |
| <a id="acr"></a>**Container Registry** `azure:acr` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  | registry, image |  |
| <a id="openai"></a>**Azure OpenAI / Foundry** `azure:openai` | [Resource group](#resourcegroup), [Region](#region) |  | foundry, gpt, llm, ai |  |
| <a id="vmss"></a>**VM scale set** `azure:vmss` | [Subnet](#subnet) | เป็นกล่อง หรือเป็นโซนเมื่อมีอะไรรันอยู่ข้างใน; มี [Container](container.md) อยู่ข้างในได้ | autoscaling, scale set, vm | min; max; size |
| <a id="disk"></a>**Managed disk** `azure:disk` | [Resource group](#resourcegroup), [Region](#region), [Availability Zone](#availabilityzone) |  | disk, volume, block storage | size; sku |
| <a id="aro"></a>**Azure Red Hat OpenShift** `azure:aro` | [Virtual network](#vnet), [Subnet](#subnet), [Resource group](#resourcegroup) | เป็นกล่อง หรือเป็นโซนเมื่อมีอะไรรันอยู่ข้างใน; มี [Kubernetes](k8s.md) อยู่ข้างในได้ | openshift, kubernetes |  |
| <a id="staticwebapps"></a>**Static Web Apps** `azure:staticwebapps` | [Resource group](#resourcegroup), [Region](#region) |  | static site, frontend, spa |  |
| <a id="batch"></a>**Batch** `azure:batch` | [Resource group](#resourcegroup), [Subnet](#subnet) |  | batch job, hpc |  |
| <a id="avd"></a>**Azure Virtual Desktop** `azure:avd` | [Resource group](#resourcegroup), [Subnet](#subnet), [Virtual network](#vnet) |  | vdi, desktop |  |
| <a id="vmware"></a>**Azure VMware Solution** `azure:vmware` | [Resource group](#resourcegroup), [Region](#region) | เป็นกล่อง หรือเป็นโซนเมื่อมีอะไรรันอยู่ข้างใน | vmware, vsphere |  |
| <a id="appconfig"></a>**App Configuration** `azure:appconfig` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet) |  | config, feature flags |  |
| <a id="sqlmi"></a>**SQL Managed Instance** `azure:sqlmi` | [Subnet](#subnet), [Virtual network](#vnet) |  | sql server, db, database | tier |
| <a id="mysql"></a>**Database for MySQL** `azure:mysql` | [Resource group](#resourcegroup), [Subnet](#subnet), [Region](#region) |  | db, database | tier |
| <a id="documentdb"></a>**Azure DocumentDB (MongoDB)** `azure:documentdb` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  | mongodb, document |  |
| <a id="files"></a>**Azure Files share** `azure:files` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  | smb, nfs, file share |  |
| <a id="netappfiles"></a>**Azure NetApp Files** `azure:netappfiles` | [Subnet](#subnet), [Virtual network](#vnet) |  | nfs, smb, file share |  |
| <a id="datalake"></a>**Data Lake Storage** `azure:datalake` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  | adls, data lake |  |
| <a id="datafactory"></a>**Data Factory** `azure:datafactory` | [Resource group](#resourcegroup), [Region](#region) |  | etl, pipeline |  |
| <a id="synapse"></a>**Synapse Analytics** `azure:synapse` | [Resource group](#resourcegroup), [Region](#region) |  | warehouse, analytics |  |
| <a id="databricks"></a>**Azure Databricks** `azure:databricks` | [Resource group](#resourcegroup), [Virtual network](#vnet) |  | spark, lakehouse |  |
| <a id="fabric"></a>**Microsoft Fabric** `azure:fabric` | [Subscription](#subscription), [Resource group](#resourcegroup) |  | lakehouse, warehouse, onelake |  |
| <a id="streamanalytics"></a>**Stream Analytics** `azure:streamanalytics` | [Resource group](#resourcegroup), [Region](#region) |  | stream, real-time |  |
| <a id="dataexplorer"></a>**Data Explorer** `azure:dataexplorer` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet) |  | kusto, logs analytics |  |
| <a id="powerbi"></a>**Power BI** `azure:powerbi` | [Subscription](#subscription) |  | bi, dashboard, report |  |
| <a id="signalr"></a>**SignalR Service** `azure:signalr` | [Resource group](#resourcegroup), [Region](#region) |  | websocket, real-time |  |
| <a id="webpubsub"></a>**Web PubSub** `azure:webpubsub` | [Resource group](#resourcegroup), [Region](#region) |  | websocket, pubsub |  |
| <a id="notificationhubs"></a>**Notification Hubs** `azure:notificationhubs` | [Resource group](#resourcegroup), [Region](#region) |  | push, notification |  |
| <a id="communication"></a>**Communication Services** `azure:communication` | [Resource group](#resourcegroup), [Region](#region) |  | sms, email, voice |  |
| <a id="iothub"></a>**IoT Hub** `azure:iothub` | [Resource group](#resourcegroup), [Region](#region) |  | iot, device |  |
| <a id="dns"></a>**Azure DNS zone** `azure:dns` | [Resource group](#resourcegroup), [Subscription](#subscription) |  | dns |  |
| <a id="trafficmanager"></a>**Traffic Manager** `azure:trafficmanager` | [Resource group](#resourcegroup), [Subscription](#subscription) |  | dns load balancing, failover |  |
| <a id="waf"></a>**Web Application Firewall policy** `azure:waf` | [Resource group](#resourcegroup), [Subscription](#subscription) |  | waf |  |
| <a id="ddos"></a>**DDoS Protection plan** `azure:ddos` | [Resource group](#resourcegroup), [Subscription](#subscription), [Virtual network](#vnet) |  | ddos |  |
| <a id="vwan"></a>**Virtual WAN hub** `azure:vwan` | [Resource group](#resourcegroup), [Region](#region), [Subscription](#subscription) | เป็นกล่อง หรือเป็นโซนเมื่อมีอะไรรันอยู่ข้างใน | hub, transit, virtual wan |  |
| <a id="routeserver"></a>**Route Server** `azure:routeserver` | [Subnet](#subnet), [Virtual network](#vnet) |  | bgp |  |
| <a id="privatelinkservice"></a>**Private Link service** `azure:privatelinkservice` | [Subnet](#subnet), [Virtual network](#vnet) |  | private link |  |
| <a id="loganalytics"></a>**Log Analytics workspace** `azure:loganalytics` | [Resource group](#resourcegroup), [Region](#region) |  | logs, kql |  |
| <a id="appinsights"></a>**Application Insights** `azure:appinsights` | [Resource group](#resourcegroup), [Region](#region) |  | apm, tracing, monitor |  |
| <a id="grafana"></a>**Managed Grafana** `azure:grafana` | [Resource group](#resourcegroup), [Region](#region) |  | dashboard, grafana |  |
| <a id="sentinel"></a>**Microsoft Sentinel** `azure:sentinel` | [Resource group](#resourcegroup), [Subscription](#subscription) |  | siem, soar |  |
| <a id="defender"></a>**Defender for Cloud** `azure:defender` | [Subscription](#subscription) |  | security, posture |  |
| <a id="backup"></a>**Backup vault** `azure:backup` | [Resource group](#resourcegroup), [Region](#region) |  | backup, recovery services |  |
| <a id="siterecovery"></a>**Site Recovery** `azure:siterecovery` | [Resource group](#resourcegroup), [Region](#region) |  | disaster recovery, dr |  |
| <a id="arc"></a>**Azure Arc** `azure:arc` | [Resource group](#resourcegroup), [Subscription](#subscription) |  | hybrid, multicloud |  |
| <a id="externalid"></a>**Entra External ID** `azure:externalid` | [Subscription](#subscription) |  | customer login, b2c, auth |  |
| <a id="aisearch"></a>**Azure AI Search** `azure:aisearch` | [Resource group](#resourcegroup), [Region](#region), [Subnet](#subnet), [Virtual network](#vnet) |  | search, vector search, rag |  |
| <a id="machinelearning"></a>**Azure Machine Learning** `azure:machinelearning` | [Resource group](#resourcegroup), [Region](#region) |  | ml, model training |  |
| <a id="documentintelligence"></a>**Document Intelligence** `azure:documentintelligence` | [Resource group](#resourcegroup), [Region](#region) |  | ocr, document, form recognizer |  |
| <a id="devops"></a>**Azure DevOps / Pipelines** `azure:devops` | ที่ไหนก็ได้ |  | ci, cd, pipeline |  |

## เส้น (line)

เส้นที่ไม่มี kind คือ traffic ธรรมดา คือส่วนหนึ่งเรียกอีกส่วน kind ด้านล่างใช้กับเส้นที่หมายถึงอย่างอื่น

| Kind | หมายถึง |
|---|---|
| <a id="line-event"></a>`azure:event` | Event or message |
| <a id="line-peering"></a>`azure:peering` | VNet peering |
| <a id="line-iam"></a>`azure:iam` | Permission (RBAC) |
| <a id="line-replication"></a>`azure:replication` | Replication |

> **ควรรู้:** หน้านี้สร้างอัตโนมัติจาก `skills/walkboard/lib/profiles.mjs` ถ้าจะเพิ่ม kind ให้แก้ไฟล์นั้น แล้วรัน `node scripts/profiles-doc.mjs`
