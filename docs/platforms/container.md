# Container

This page lists every Container kind that Walkboard knows: the boxes, zones and lines you can draw on a [map](../pictures/map.md), and where each one usually sits.

When a box has one of these kinds, the map shows its icon and fields. If you put it somewhere other than the zones listed under "Usually in", a small amber ⚠ appears next to its name. It is only a hint, so if you mean it, that is fine. To learn how kinds work, see [Platforms](README.md).

![A small web app with a database and a job, drawn with Container kinds](https://raw.githubusercontent.com/aiyaruch1320/walkboard/media/platforms/container.png)

[Open this map in the live example and click a box to see its kind ↗](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=container&step=all)

## Zones

A zone is a frame that holds boxes and other zones.

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="host"></a>**Container host** `container:host` | [Swarm cluster](#swarm) |  | docker, podman, docker host | runtime (docker, podman, containerd); os |
| <a id="compose"></a>**Compose project** `container:compose` | [Container host](#host) |  | docker compose, stack |  |
| <a id="network"></a>**Container network** `container:network` | [Container host](#host), [Compose project](#compose) |  | docker network, bridge | driver (bridge, host, overlay, macvlan, ipvlan) |
| <a id="swarm"></a>**Swarm cluster** `container:swarm` | anywhere |  | docker swarm, cluster |  |

## Boxes

A box is one resource, such as a server, a database or a queue.

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="container"></a>**Container** `container:container` | [Container host](#host), [Compose project](#compose), [Container network](#network), [Podman pod](#pod), [Swarm cluster](#swarm) |  | docker, service | image; ports; replicas; restart (no, always, unless-stopped, on-failure) |
| <a id="volume"></a>**Volume** `container:volume` | [Container host](#host), [Compose project](#compose), [Swarm cluster](#swarm) |  | disk, mount | mount; driver |
| <a id="envfile"></a>**Env / config file** `container:envfile` | [Container host](#host), [Compose project](#compose) |  | env, .env, config |  |
| <a id="registry"></a>**Image registry** `container:registry` | anywhere |  | image |  |
| <a id="pod"></a>**Podman pod** `container:pod` | [Container host](#host), [Container network](#network) | a box, or a zone when something runs inside it | podman pod |  |
| <a id="proxy"></a>**Reverse proxy** `container:proxy` | [Container host](#host), [Compose project](#compose), [Container network](#network), [Swarm cluster](#swarm) |  | traefik, nginx, caddy, ingress | ports |
| <a id="secret"></a>**Secret** `container:secret` | [Container host](#host), [Compose project](#compose), [Swarm cluster](#swarm) |  | password, compose secret |  |
| <a id="config"></a>**Config** `container:config` | [Container host](#host), [Compose project](#compose), [Swarm cluster](#swarm) |  | compose config, config file |  |
| <a id="bindmount"></a>**Bind mount (host folder)** `container:bindmount` | [Container host](#host), [Compose project](#compose) |  | host path, folder | path |

## Lines

A line without a kind is plain traffic, one part calling another. These kinds are for lines that mean something else.

| Kind | Means |
|---|---|
| <a id="line-uses"></a>`container:uses` | Mounts or reads |
| <a id="line-depends"></a>`container:depends` | Starts after (depends_on) |
| <a id="line-publishes"></a>`container:publishes` | Publishes a port |

> **Good to know:** This page is generated from `skills/walkboard/lib/profiles.mjs`. To add a kind, change that file and run `node scripts/profiles-doc.mjs`.
