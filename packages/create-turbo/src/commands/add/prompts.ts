import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import type { PackageManager, Project } from "@turbo/workspaces";
import type { AddCommandArgument } from "./types";
import { getAvailablePackageManagers } from "@turbo/utils";
import { isFolderEmpty } from "../../utils/isFolderEmpty";
import inquirer from "inquirer";

export async function name({ name }: { name: AddCommandArgument }) {
  return inquirer.prompt<{
    selectedName: string;
  }>({
    type: "input",
    name: "selectedName",
    when: !name,
    default: name,
    message: "What is the name of the workspace?",
  });
}

export async function location({
  workspaceRoots,
  name,
}: {
  workspaceRoots: Array<string>;
  name: string;
}) {
  const locationAnswer = await inquirer.prompt<{
    selectedLocation: string;
  }>({
    type: "list",
    name: "selectedLocation",
    message: `Where should "${name}" be added?`,
    choices: workspaceRoots.map((workspaceRoot) => ({
      name: workspaceRoot,
      value: workspaceRoot,
    })),
  });

  return locationAnswer;
}

export async function dependencies({
  project,
  type,
}: {
  project: Project;
  type?: "dev";
}) {
  return await inquirer.prompt<{
    projectDependencies: Array<string>;
  }>({
    type: "checkbox",
    name: "projectDependencies",
    message: `Which workspaces should be added as ${
      type ? `${type}Dependencies` : "dependencies"
    }?`,
    choices: project.workspaceData.workspaces.map((workspace) => ({
      name: workspace.name,
      value: workspace.name,
    })),
  });
}
