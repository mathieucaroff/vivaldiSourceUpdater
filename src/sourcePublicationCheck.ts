import { exec } from "child_process"
import { promisify } from "util"
import {
  awaitInstanceDeletion,
  awaitInstanceReady,
  createInstance,
  deleteInstance,
  getInstanceIp,
} from "./utils/digitalOcean"
import { sendNotification } from "./utils/email"
import { getNewSourceArchives, getSourceArchives } from "./utils/sourceParser"
import { getLastRepositoryVersion } from "./utils/github"
import { config, envString } from "./config"

const execAsync = promisify(exec)

/**
 * Check for new Vivaldi source code archives on the GitHub repository,
 * compared to the last version of the Vivaldi-browser repository. If new
 * archives are found, create a Digital Ocean instance to process them.
 */
async function sourcePublicationCheck() {
  let dropletId = 0

  try {
    await sendNotification(
      "Vivaldi Source Publication Check Started",
      "Starting daily check for new Vivaldi source code"
    )
    // Get the last version from the last repository commit via the GitHub GraphQL API
    const lastRepositoryVersion = await getLastRepositoryVersion()

    const newArchives = await getNewSourceArchives(lastRepositoryVersion)

    if (newArchives.length > 0) {
      // Create high-performance instance
      dropletId = await createInstance()
      await sendNotification(
        "New Vivaldi Source found, instance created",
        `Found ${newArchives.length} new source archive(s). Created instance ${dropletId} to process them.`
      )

      // Wait for instance to be ready
      try {
        await awaitInstanceReady(dropletId, 2_000, 300) // check every 2 seconds, for 10 minutes
      } catch (e) {
        await sendNotification(
          "FAILED Instance Creation",
          `Instance ${dropletId} was not ready before the timeout was reached.`
        )
        throw e
      }

      try {
        setupAndStartInstance(dropletId)
      } catch (e) {
        await sendNotification(
          "FAILED Instance Setup",
          `Instance ${dropletId} set up and start failed with message: ${(e as any).message}`
        )
        throw e
      }

      try {
        await awaitInstanceDeletion(dropletId, 10_000, 900) // check every 10 seconds for 2h30
      } catch (e) {
        await sendNotification(
          "FAILED Instance Processing",
          `Instance ${dropletId} reached timeout before it finished processing the data (its deletion was not detected).`
        )
        throw e
      }

      await sendNotification(
        "Instance Deleted",
        `Instance ${dropletId} was correctly deleted after processing`
      )
    }
  } catch (error) {
    await sendNotification("Vivaldi Source Check Error", `Error during source check: ${error}`)
    if (dropletId) {
      try {
        await deleteInstance(dropletId)
        await sendNotification(
          "Instance Deletion",
          `Instance ${dropletId} was correctly deleted after an error occurred.`
        )
      } catch (secondError) {
        await sendNotification(
          "Vivaldi Source Updater WARNING",
          `Error-handling deletion of instance ${dropletId} produced an error: ${secondError}. You should check whether the instances has been deleted in the Digital Ocean webapp.`
        )
      }
    }
  }
}

/**
 * Given an instance ID, get its IP, connect to it via SSH and install the
 * dependencies needed to run the updater scripts:
 * - NodeJS, with yarn berry
 * - Git
 * Then clone the updater repository, install its dependencies using yarn
 * build the code with TypeScript and run it.
 */
async function setupAndStartInstance(dropletId: number) {
  // Get the IP address of the instance
  const instanceIp = await getInstanceIp(dropletId)

  // Helper function to execute SSH commands
  async function runSSH(command: string) {
    console.log(`Running command via SSH: ${command}`)

    try {
      await execAsync(`ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${instanceIp} "${command}"`);
    } catch (error) {
      throw new Error(`SSH command failed: ${command}, ${(error as any).message}`);
    }
  }

  // Install dependencies on the instance
  await runSSH("apt-get update && apt-get install -y nodejs npm git");

  // Install Yarn (Berry version)
  await runSSH("npm install -g corepack && corepack enable && corepack prepare yarn@stable --activate");

  // Clone the updater repository
  await runSSH(`git clone https://github.com/${config.github.updaterRepository}.git updater`);

  // Navigate to the repository, install dependencies, build, and run the updater
  await runSSH(`cd updater && yarn install && yarn build && env ${envString} node dist/sourceUpdate.js ${dropletId}`);
}

sourcePublicationCheck()
