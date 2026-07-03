---
name: ONNX native module builds in pnpm monorepo
description: onnxruntime-node (and similar native-binary npm packages) need explicit allow-listing to run their install scripts under pnpm's default security posture.
---

By default pnpm ignores postinstall/install scripts for dependencies unless
they are explicitly allow-listed. Packages that ship native binaries (e.g.
`onnxruntime-node`, which downloads platform-specific `.so`/`.node` files
during postinstall) will silently fail to work — the package installs but
the binary is missing — unless the script is allowed to run.

**Why:** `pnpm install` in this workspace runs non-interactively (no TTY),
so `pnpm approve-builds <pkg>` cannot be used to interactively approve a
package's build scripts.

**How to apply:** Add the package name to `onlyBuiltDependencies` in
`pnpm-workspace.yaml`, then re-run `pnpm install`. Verify success by
checking the install log for the package's postinstall step actually
running (not just resolving/reusing from the store).
