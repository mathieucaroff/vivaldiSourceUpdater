import { deleteInstance, listInstances } from "./utils/digitalOcean"
import { sendMail } from "./utils/email"

async function resourceDeletionCheck() {
  try {
    const instances = await listInstances()

    for (const instance of instances) {
      await deleteInstance(instance.id)
      await sendMail(
        "Vivaldi Source Updater - Security Check - Instance Deleted",
        `Deleted instance ${instance.id} during security check`
      )
    }
  } catch (error) {
    await sendMail(
      "Vivaldi Source Updater - Security Check Error",
      `Error during security check: ${error}`
    )
  }
}

resourceDeletionCheck()
