# container (Container)

Each line: kind and name; `zone` or `also zone` (else a box); in = where it usually sits; props. How to use them: views/map.md.

- `container:host` Container host · zone · in Swarm cluster · runtime: docker / podman / containerd; os
- `container:compose` Compose project · zone · in Container host
- `container:network` Container network · zone · in Container host, Compose project · driver: bridge / host / overlay / macvlan / ipvlan
- `container:container` Container · in Container host, Compose project, Container network, Podman pod, Swarm cluster · image; ports; replicas; restart: no / always / unless-stopped / on-failure
- `container:volume` Volume · in Container host, Compose project, Swarm cluster · mount; driver
- `container:envfile` Env / config file · in Container host, Compose project
- `container:registry` Image registry
- `container:swarm` Swarm cluster · zone
- `container:pod` Podman pod · also zone · in Container host, Container network
- `container:proxy` Reverse proxy · in Container host, Compose project, Container network, Swarm cluster · ports
- `container:secret` Secret · in Container host, Compose project, Swarm cluster
- `container:config` Config · in Container host, Compose project, Swarm cluster
- `container:bindmount` Bind mount (host folder) · in Container host, Compose project · path

Lines: `container:uses` Mounts or reads, `container:depends` Starts after (depends_on), `container:publishes` Publishes a port; without a kind a line is traffic.
