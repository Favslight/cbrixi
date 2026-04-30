#!/usr/bin/env node

const { execSync } = require("node:child_process");

function hasPackage(name) {
  try {
    require.resolve(name);
    return true;
  } catch {
    return false;
  }
}

function npmInstall(pkg) {
  execSync(`npm install --no-save ${pkg}`, { stdio: "inherit" });
}

const isLinux = process.platform === "linux";
if (!isLinux) {
  process.exit(0);
}

const bindingName = "lightningcss-linux-x64-gnu";
const hasBinding = hasPackage(bindingName);

if (hasBinding) {
  process.exit(0);
}

console.log(
  `[postinstall] Missing ${bindingName}. Installing Linux native binding for lightningcss...`
);

try {
  npmInstall(`${bindingName}@1.31.1`);
  console.log("[postinstall] lightningcss Linux binding installed.");
} catch (error) {
  console.error(
    "[postinstall] Failed to install lightningcss Linux binding. Run `npm install` again and verify optional dependencies are enabled."
  );
  throw error;
}
