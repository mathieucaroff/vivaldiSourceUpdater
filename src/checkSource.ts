import { exec } from "child_process"
import path from "path"
import { promisify } from "util"
import { config } from "./config"
import { createInstance, deleteInstance } from "./utils/digitalOcean"
import { sendNotification } from "./utils/email"
import { GitManager } from "./utils/git"
import { getSourceArchives } from "./utils/sourceParser"

const execAsync = promisify(exec)

async function checkVivaldiSource() {
  try {
    await sendNotification(
      "Vivaldi Source Check Started",
      "Starting daily check for new Vivaldi source code",
    )

    // Get list of source archives
    const archives = await getSourceArchives()

    // TODO: Compare with existing versions in repository
    const newArchives = archives // For now, process all archives

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

      // Wait for instance to be ready
      await new Promise((resolve) => setTimeout(resolve, 60000))

      // Process each archive
      for (const archive of newArchives) {
        const workDir = `/tmp/vivaldi-${archive.version}`

        // SSH commands to process archive
        const commands = [
          `mkdir -p ${workDir}`,
          `cd ${workDir}`,
          `wget ${archive.url}`,
          `tar xf *.tar.gz`,
          // Setup git
          `git config --global user.email "bot@example.com"`,
          `git config --global user.name "Vivaldi Source Bot"`,
        ]

        // Execute commands on remote instance
        for (const cmd of commands) {
          await execAsync(`ssh root@${instance.networks.v4[0].ip_addr} '${cmd}'`)
        }

        // Setup git manager
        const git = new GitManager(workDir)

        // Clone repository
        await git.clone(`https://github.com/${config.github.repository}.git`)

        // Create commit and tag for new version
        await git.createVersionCommit(archive.version, path.join(workDir, "vivaldi-source"))

        // Push changes
        await git.push()
      }

      // Delete instance
      await deleteInstance(instance.id)
      await sendNotification("Instance Deleted", `Deleted instance ${instance.id} after processing`)
    }
  } catch (error) {
    await sendNotification("Vivaldi Source Check Error", `Error during source check: ${error}`)
  }
}

checkVivaldiSource()
