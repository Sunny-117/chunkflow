#!/usr/bin/env node

/**
 * Fix workspace dependencies before publishing
 * Replaces "workspace:*" with actual version numbers
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Get all package.json files in packages directory
const packageFiles = glob.sync("packages/*/package.json");

console.log("🔧 Fixing workspace dependencies...\n");

packageFiles.forEach((pkgPath) => {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  // Skip if no dependencies
  if (!pkg.dependencies) {
    return;
  }

  let modified = false;

  // Replace workspace:* with actual version
  Object.keys(pkg.dependencies).forEach((dep) => {
    if (pkg.dependencies[dep] === "workspace:*") {
      // Find the dependency package
      const depPkgPath = path.join("packages", dep.split("/").pop(), "package.json");

      if (fs.existsSync(depPkgPath)) {
        const depPkg = JSON.parse(fs.readFileSync(depPkgPath, "utf8"));
        pkg.dependencies[dep] = `^${depPkg.version}`;
        console.log(`  ${pkg.name}: ${dep} workspace:* → ^${depPkg.version}`);
        modified = true;
      }
    }
  });

  if (modified) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }
});

console.log("\n✅ Workspace dependencies fixed!");
