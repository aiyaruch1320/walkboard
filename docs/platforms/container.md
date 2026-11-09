# Container

[Docs](../README.md) › [Platforms](README.md) › Container

What boxes, zones and lines can be on Container, and where each usually sits. On a map the page draws a kind's icon and fields, and shows a small amber ⚠ when something sits outside the zones listed here. That is a hint, never a block: if you mean it, it is fine. How profiles work: [Platforms](README.md).

This page is generated from `skills/walkboard/lib/profiles.mjs`.

## Zones

Frames that hold other things.

| Kind | Usually in | Notes | Also called | Fields |
|---|---|---|---|---|
| <a id="host"></a>**Container host** `container:host` | [Swarm cluster](#swarm) |  | docker, podman, docker host | runtime (docker, podman, containerd); os |
| <a id="compose"></a>**Compose project** `container:compose` | [Container host](#host) |  | docker compose, stack |  |
| <a id="network"></a>**Container network** `container:network` | [Container host](#host), [Compose project](#compose) |  | docker network, bridge | driver (bridge, host, overlay, macvlan, ipvlan) |
| <a id="swarm"></a>**Swarm cluster** `container:swarm` | anywhere |  | docker swarm, cluster |  |

## Boxes

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

A line without a kind is traffic: one part calling another.

| Kind | Means |
|---|---|
| <a id="line-uses"></a>`container:uses` | Mounts or reads |
| <a id="line-depends"></a>`container:depends` | Starts after (depends_on) |
| <a id="line-publishes"></a>`container:publishes` | Publishes a port |
