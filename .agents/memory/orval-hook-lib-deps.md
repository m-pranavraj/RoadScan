---
name: Orval-generated types need direct package deps
description: Importing generated Zod/type packages (e.g. @workspace/api-zod) directly in an artifact requires adding that package as a real dependency, not relying on transitive resolution through another workspace lib.
---

In this pnpm workspace, `@workspace/api-client-react` (Orval-generated React
Query hooks) depends on `@workspace/api-zod` (Orval-generated Zod schemas +
TS types), but that dependency is internal to api-client-react's own
package.json. An artifact that only depends on `@workspace/api-client-react`
can still typecheck against re-exported hook return types, but cannot
directly `import type { X } from "@workspace/api-zod"` — TypeScript module
resolution requires the importing package to declare the dependency itself.

**Why:** pnpm's strict node_modules layout does not hoist transitive
workspace dependencies into a package's own resolution path.

**How to apply:** If a component needs a named type from a generated types
package (e.g. `Detection`, `DetectionCounts`) rather than just consuming a
hook's inferred return type, add that generated package (e.g.
`@workspace/api-zod`) as `workspace:*` in the consuming artifact's
package.json, then `pnpm install` before typechecking.
