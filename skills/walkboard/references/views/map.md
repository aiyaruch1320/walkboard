# map

```json
{"id":"net","kind":"map","zones":[{"label":"ap-southeast-1","kind":"aws:region","zones":[
  {"id":"vpc-a","label":"VPC","kind":"aws:vpc","props":{"cidr":"10.0.0.0/16"},"nodes":["ec2a"]},
  {"label":"Link","nodes":["pcx"]},
  {"id":"vpc-b","label":"VPC","kind":"aws:vpc","props":{"cidr":"10.1.0.0/16"},"nodes":["ec2b"]}]}],
 "links":[{"from":"ec2a","to":"pcx","state":"ok","label":"route 10.1.0.0/16"},{"from":"pcx","to":"ec2b"}]}
```

- **Zones** nest (`label`, `icon`, `note`, `zones`, `nodes`), up to eight levels; three or four read best. Two zones may share a label when each has its own `id`; a zone is known by its `id`, else its label.
- **`stack`**: `true` stacks what a zone holds top to bottom, `false` keeps it side by side.
- **Links**: `{"from","to","label","state","kind"}`. `state`: `ok` (solid green), `todo` (dashed orange), `blocked` (dotted red), `standby` (dotted blue, a backup path). `label` (usually the port) sits on the box it reaches. Always show blocked and not-yet-open paths.
- **A whole system** (over 12 boxes, or 4+ top-level zones) gets smaller boxes, top-level zones in one row and zones of only boxes stacked: read left to right, outside first, one column per site or provider, at most 5.
- A shared box with no line reads as floating: put such boxes in a zone named for it ("Shared").

## Profiles: what it is on a platform

On a cloud or platform, give boxes (`nodes.<id>.kind`), zones and links a `kind` from a profile: read only the ones you draw, `references/profiles/<name>.md`: `aws`, `gcp`, `azure`, `huawei`, `onprem`, `container`, `k8s`.

- `"kind": "aws:rds"`, with that kind's fields in `props` (`{"engine":"postgres"}`, strings). The page draws its icon (unless `icon` says otherwise) and fields and tags the picture with the platform.
- "in" is where a kind usually goes: the page warns, never blocks, when the nearest zone with a kind is another one; a zone without a kind says nothing. Look for no warnings from `WB check`.
- A kind marked "also zone" can be either: make it a zone when something runs inside it (an EC2 with its containers).
- Profiles mix: an EKS cluster in an AWS VPC is a `k8s:cluster` zone in an `aws:vpc` zone, with `k8s:namespace` zones and workloads in it.
- A network policy or security group is a zone around what it covers; a config a workload reads is a `k8s:uses` line.
- Anything no profile covers goes without a kind and is drawn as you write it.
