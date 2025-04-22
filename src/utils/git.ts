import fs from "fs"
import path from "path"
import simpleGit, { SimpleGit } from "simple-git"

export class GitManager {
  private git: SimpleGit
  private repoPath: string

  constructor(repoPath: string, userName: string, userEmail: string) {
    this.repoPath = repoPath
    this.git = simpleGit(repoPath)

    this.git.addConfig("user.name", userName, false, 'global')
    this.git.addConfig("user.email", userEmail, false, 'global')
  }

  async clone(url: string): Promise<void> {
    if (!fs.existsSync(this.repoPath)) {
      fs.mkdirSync(this.repoPath, { recursive: true })
    }
    await this.git.clone(url, this.repoPath, ["--depth", "1"])
  }

  async createVersionCommitAndTag(version: string): Promise<void> {
    // Add all files from the repository directory
    await this.git.add(this.repoPath)

    // Create commit with version
    await this.git.commit(`Added version ${version}`)

    // Create tag for the version
    await this.git.addTag(version)
  }

  async push(): Promise<void> {
    await this.git.push()
    await this.git.pushTags()
  }

  /** Move the .git folder from the repository folder to the `to` folder, as
   * well as the README.md file. Also, recreate the simpleGit instance using
   * the updated repository path.
   */
  async moveGitAndReadmeMd(to: string): Promise<void> {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to, { recursive: true })
    }

    // Move .git folder
    const gitFolderSource = path.join(this.repoPath, ".git")
    const gitFolderDest = path.join(to, ".git")

    // If source .git folder doesn't exist, throw
    if (!fs.existsSync(gitFolderSource)) {
      throw new Error("No .git folder found in the source directory")
    }

    // If destination .git already exists, remove it
    if (fs.existsSync(gitFolderDest)) {
      fs.rmSync(gitFolderDest, { recursive: true, force: true })
    }

    // Move the .git folder
    fs.renameSync(gitFolderSource, gitFolderDest)

    // Move README.md file
    const readmeSource = path.join(this.repoPath, "README.md")
    const readmeDest = path.join(to, "README.md")

    if (!fs.existsSync(readmeSource)) {
      throw new Error("No README.md file found in the source directory")
    }

    // If destination README.md already exists, remove it
    if (fs.existsSync(readmeDest)) {
      fs.unlinkSync(readmeDest)
    }

    // Move the README.md file
    fs.renameSync(readmeSource, readmeDest)

    // Update the repoPath and recreate the git instance
    this.repoPath = to
    this.git = simpleGit(this.repoPath)
  }
}
