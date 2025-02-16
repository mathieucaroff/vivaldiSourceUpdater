import axios from "axios"
import { createInstance, deleteInstance } from "./utils/digitalOcean"
import { sendNotification } from "./utils/email"

async function checkVivaldiSource() {
  try {
    await sendNotification(
      "Vivaldi Source Check Started",
      "Starting daily check for new Vivaldi source code",
    )

    // Scrape vivaldi.com/source for new archives
    const response = await axios.get("https://vivaldi.com/source/")
    // TODO: Parse the page to find source archives
    const newArchives: string[] = [] // Add logic to find new archives

    if (newArchives.length > 0) {
      await sendNotification(
        "New Vivaldi Source Found",
        `Found ${newArchives.length} new source archives`,
      )

      // Create high-performance instance
      const instance = await createInstance()
      await sendNotification(
        "Instance Created",
        `Created instance ${instance.id} for processing new source`,
      )

      // TODO: Add logic to:
      // 1. SSH into instance
      // 2. Download and extract archives
      // 3. Clone repository
      // 4. Create commits and tags
      // 5. Push changes

      // Delete instance
      await deleteInstance(instance.id)
      await sendNotification("Instance Deleted", `Deleted instance ${instance.id} after processing`)
    }
  } catch (error) {
    await sendNotification("Vivaldi Source Check Error", `Error during source check: ${error}`)
  }
}

checkVivaldiSource()
