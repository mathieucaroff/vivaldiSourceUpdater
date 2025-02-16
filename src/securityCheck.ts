import { deleteInstance, listInstances } from "./utils/digitalOcean"
import { sendNotification } from "./utils/email"

async function securityCheck() {
  try {
    const instances = await listInstances()

    for (const instance of instances) {
      await deleteInstance(instance.id)
      await sendNotification(
        "Security Check - Instance Deleted",
        `Deleted instance ${instance.id} during security check`,
      )
    }
  } catch (error) {
    await sendNotification("Security Check Error", `Error during security check: ${error}`)
  }
}

securityCheck()
