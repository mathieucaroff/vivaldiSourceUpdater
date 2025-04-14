import { exec } from "child_process"
import { promisify } from "util"
import {
  awaitInstanceDeletion,
  awaitInstanceReady,
  createInstance,
  deleteInstance,
  DropletInfo,
} from "./utils/digitalOcean"
import { sendNotification } from "./utils/email"
import { getSourceArchives } from "./utils/sourceParser"
import { getLastRepositoryVersion } from "./utils/github"

const execAsync = promisify(exec)

/**
 *
 */
async function sourcePublicationCheck() {
  let instance: DropletInfo = { id: "", ipv4: "" }

  try {
    await sendNotification(
      "Vivaldi Source Check Started",
      "Starting daily check for new Vivaldi source code"
    )

    // Get list of versions from the repository commits via the GitHub GraphQL API

    // Get list of source archives
    const archives = await getSourceArchives()

    const lastRepositoryVersion = await getLastRepositoryVersion()
    // TODO: Compare archive versions with lastRepositoryVersion, filter out archivse of smaller or equal version
    const newArchives = archives // For now, process all archives

    if (newArchives.length > 0) {
      // Create high-performance instance
      instance = await createInstance()
      await sendNotification(
        "New Vivaldi Source found, instance created",
        `Found ${newArchives.length} new source archive(s). Created instance ${instance.id} to process them.`
      )

      // Wait for instance to be ready
      try {
        await awaitInstanceReady(instance, 2_000, 300) // check every 2 seconds, for 10 minutes
      } catch (e) {
        await sendNotification(
          "FAILED Instance Creation",
          `Instance ${instance.id} was not ready before the timeout was reached.`
        )
        throw e
      }

      setupAndStartInstance(instance)

      try {
        await awaitInstanceDeletion(instance.id, 10_000, 900) // check every 10 seconds for 2h30
      } catch (e) {
        await sendNotification(
          "FAILED Instance Processing",
          `Instance ${instance.id} reached timeout before it finished processing the data (its deletion was not detected).`
        )
        throw e
      }

      await sendNotification(
        "Instance Deleted",
        `Instance ${instance.id} was correctly deleted after processing`
      )
    }
  } catch (error) {
    await sendNotification("Vivaldi Source Check Error", `Error during source check: ${error}`)
    if (instance.id) {
      try {
        deleteInstance(instance.id)
      } catch (secondError) {
        await sendNotification(
          "Vivaldi Source Updater WARNING",
          `Error-handling deletion of instance ${instance.id} produced an error: ${secondError}. You should check whether the instances has been deleted in the Digital Ocean webapp.`
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
function setupAndStartInstance(dropletInfo: DropletInfo) {}

sourcePublicationCheck()
