import { exec } from "child_process"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { config } from "./config"
import { deleteInstance } from "./utils/digitalOcean"
import { sendNotification } from "./utils/email"
import { GitManager } from "./utils/git"
import { getNewSourceArchives, getSourceArchives } from "./utils/sourceParser"
import { getLastRepositoryVersion } from "./utils/github"

const execAsync = promisify(exec)

async function sourceUpdate() {
  try {
    await sendNotification(
      "Vivaldi Source Update Started",
      "Starting update of the repository using the website source code"
    )
    const lastRepositoryVersion = await getLastRepositoryVersion()

    const newArchives = await getNewSourceArchives(lastRepositoryVersion)

    // Define the work directory for the repository
    let workDir = `/tmp/vivaldi-${lastRepositoryVersion}`

    // Setup git manager
    const git = new GitManager(workDir, config.git.user.name, config.git.user.email)

    // Clone repository into the work directory
    await git.clone(`https://github.com/${config.github.vivaldiRepository}.git`)

    // Process each archive
    for (const archive of newArchives) {
      const newWorkDir = `/tmp/vivaldi-${archive.version}`
      const archiveFileName = `${newWorkDir}.tar.gz`

      // Download the archive
      await execAsync(`curl -O ${archiveFileName} ${archive.url}`)

      // Extract the archive
      await execAsync(`tar -xzf ${archiveFileName}`)

      // Rename the extracted folder to the work directory
      fs.renameSync("vivaldi-source", newWorkDir)

      git.moveGitAndReadmeMd(newWorkDir)

      // Create commit and tag for new version
      await git.createVersionCommitAndTag(archive.version)

      // Push changes
      await git.push()

      await sendNotification("Vivaldi Source Update Progress", `Vivaldi archive ${archive.version} has been added and pushed`)
    }

    const thisInstanceId = Number(process.argv[2])
    if (Number.isNaN(thisInstanceId)) {
      throw new Error("Instance ID is not a number")
    }

    // Delete this instance
    await deleteInstance(thisInstanceId)
  } catch (error) {
    await sendNotification("Vivaldi Source Update Error", `Error during source update: ${error}`)
  }
}

sourceUpdate()
