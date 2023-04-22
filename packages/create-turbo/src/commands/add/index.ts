import path from "path";
import fs from "fs-extra";
import type { AddCommandArgument } from "./types";
import chalk from "chalk";
import type { Project } from "@turbo/workspaces";
import { getWorkspaceDetails } from "@turbo/workspaces";
import * as prompts from "./prompts";

export async function add(
  directory: AddCommandArgument,
  name: AddCommandArgument
) {
  if (!directory) {
    console.log("invalid directory");
    return;
  }

  const project = await getWorkspaceDetails({
    root: path.resolve(directory),
  });

  const allWorkspaces = project.workspaceData.workspaces;
  const allWorkspacePaths = allWorkspaces.map((workspace) =>
    path.relative(project.paths.root, workspace.paths.root)
  );

  // find valid workspace locations
  const workspaceRoots = new Set<string>();
  project.workspaceData.globs.forEach((glob) => {
    if (allWorkspacePaths.includes(glob)) {
      return;
    } else if (glob.startsWith("!")) {
      return;
    } else {
      const globParts = glob.split("/");
      const globRoot = globParts[0];
      workspaceRoots.add(globRoot);
    }
  });

  const { selectedName } = await prompts.name({ name });
  const { selectedLocation } = await prompts.location({
    workspaceRoots: Array.from(workspaceRoots),
    name: selectedName,
  });
  const { projectDependencies: dependencies } = await prompts.dependencies({
    project,
  });
  const { projectDependencies: devDependencies } = await prompts.dependencies({
    project,
    type: "dev",
  });

  const packageJson = {
    name: selectedName,
    version: "0.0.0",
    private: true,
    scripts: {
      build: "turbo build",
    },
    dependencies: dependencies.reduce((acc, dependency) => {
      acc[dependency] = "workspace:*";
      return acc;
    }, {} as Record<string, string>),
    devDependencies: devDependencies.reduce((acc, dependency) => {
      acc[dependency] = "workspace:*";
      return acc;
    }, {} as Record<string, string>),
  };

  // location
  const newWorkspace = path.join(
    project.paths.root,
    selectedLocation,
    selectedName
  );
  fs.mkdirSync(newWorkspace, { recursive: true });
  // create package.json
  fs.writeFileSync(
    path.join(newWorkspace, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
  // create README
  fs.writeFileSync(path.join(newWorkspace, "README.md"), `# \`${name}\``);

  chalk.green("Workspace created!");
}
