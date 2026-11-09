# Draw a system you already have

Walkboard can draw the infrastructure you already run, not only new work. If your repository describes it in files, such as Terraform, Kubernetes manifests or Compose files, the agent can read them and draw a [map](pictures/map.md): what sits inside what, and what connects to what.

This page shows you how to ask for that map, check it, and use it to plan a change.

## Asking for the map

Open Claude Code in the repository and say what you want to see, and where it is described. For example:

```
/walkboard explain our AWS network from the Terraform in infra/
/walkboard draw the Kubernetes setup in deploy/
```

The agent works in [explain mode](modes/explain.md). It reads the files and draws the accounts, networks, clusters and services it finds. A box that comes from a file points at the file and line that defines it, so you can click it and see the code.

## Checking what the agent could not find

Files rarely tell the whole story. A security group may be managed somewhere else, or a service may be set up by hand. When the agent cannot find something in the repository, it does not quietly fill the gap. It draws the box dashed with ❓, so you can see what is a guess.

To answer a guess, press **✎ Answer** and say what is true. If the picture is wrong in some other way, tell the agent in the chat, for example "the database is in the data subnet, not the app subnet".

> **Good to know:** Explain mode never changes your project. The map shows what your files say, which may not be exactly what is running. If you want the agent to look at your live cloud account too, ask it to compare designs for your next change. In [design mode](modes/design.md) it may check what exists, using only read-only commands, and it asks you before each one.

## Planning a change on the map

Once the map is right, you can use it to plan what comes next. There are two ways:

- **Ask for it.** For example, "plan adding a read replica for the orders database". The agent starts a [plan](modes/plan.md) for the change.
- **Draw it.** Press **✎ Draft changes** and [sketch the change yourself](draft.md), then press **Ask the agent to review**.

## Next steps

- [Map](pictures/map.md): how to read zones, lines and ports.
- [Platforms](platforms/README.md): what each kind of box means on AWS, Google Cloud, Azure, Kubernetes and more.
