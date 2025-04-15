import { exec } from "child_process"
import path from "path"
import { promisify } from "util"
import { config } from "./config"
import { deleteInstance } from "./utils/digitalOcean"
import { sendNotification } from "./utils/email"
import { GitManager } from "./utils/git"
import { getSourceArchives } from "./utils/sourceParser"
import { getLastRepositoryVersion } from "./utils/github"

const execAsync = promisify(exec)

async function sourceUpdate() {
  try {
    await sendNotification(
      "Vivaldi Source Update Started",
      "Starting update of the repository using the website source code"
    )
    
    // Get the last version from the last repository commit via the GitHub GraphQL API
    const lastRepositoryVersion = await getLastRepositoryVersion()

    // Get list of source archives
    const archives = await getSourceArchives()

    // TODO: Compare archive versions with lastRepositoryVersion, filter out archivse of smaller or equal version
    const newArchives = archives.slice(-2) // For now, process the two most recent archives

    // Process each archive
    for (const archive of newArchives) {
      const workDir = `/tmp/vivaldi-${archive.version}`

      // Setup git manager
      const git = new GitManager(workDir)

      // Clone repository
      await git.clone(`https://github.com/${config.github.vivaldiRepository}.git`)

      // Create commit and tag for new version
      await git.createVersionCommit(archive.version, path.join(workDir, "vivaldi-source"))

      // Push changes
      await git.push()
    }

    const thisInstanceId = process.argv[2]

    // Delete this instance
    await deleteInstance(thisInstanceId)
  } catch (error) {
    await sendNotification("Vivaldi Source Update Error", `Error during source update: ${error}`)
  }
}

sourceUpdate()
