# Views

Every view has `id`, `kind` and `title`; the `title` is its tab, so give it words a reader knows, not an id. Every box is a node id, so a click opens the same details and chat. Each picture answers its own question; two that show the same thing are noise. Use made-up values, never real customer data.

| The reader asks | Picture: read its file before writing it |
|---|---|
| What are the steps, in order? | `flow` (built from the steps when there are no `views`; with other pictures, write it ([file](views/flow.md)) only if the order helps) |
| What sits inside what, on which platform (AWS account › VPC › subnet, cluster › namespace › pods, a host and its containers)? | [`map`](views/map.md), with profile kinds |
| Who calls whom, in what order, and what if it fails? | [`sequence`](views/sequence.md) |
| What does the data look like before and after? | [`transform`](views/transform.md) |
| What happens to one piece of data along the way? | [`journey`](views/journey.md) |
| Which states can it be in, and what moves it? | [`state`](views/state.md) |
| If this, then what? (rules, routing, validation) | [`decision`](views/decision.md) |
| When and how long? (retries, timeouts, cron) | [`timeline`](views/timeline.md) |
| What are the tables, keys and relations? | [`datamodel`](views/datamodel.md) |
| If this goes down, what breaks? | [`impact`](views/impact.md) |
| What changes between now and after? | [`diff`](views/diff.md) |

The user can arrange map, datamodel, state, decision and impact pictures; the page saves that in `layout` (a box may also carry `sides`, the side each line meets). Never write `layout`. They can also sketch changes on those and on flows (draft mode), kept apart from plan.json; these reach you as `review` ([review.md](review.md)).
