import fs from "fs"
import path from "path"
import simpleGit, { SimpleGit } from "simple-git"

export class GitManager {
  private git: SimpleGit
  private repoPath: string

  constructor(repoPath: string) {
    this.repoPath = repoPath
    this.git = simpleGit(repoPath)
  }

  async clone(url: string): Promise<void> {
    if (!fs.existsSync(this.repoPath)) {
      fs.mkdirSync(this.repoPath, { recursive: true })
    }
    await this.git.clone(url, this.repoPath, ["--depth", "1"])
  }

  async createVersionCommit(version: string, sourcePath: string): Promise<void> {
    // Add all files from the source directory
    await this.git.add(path.join(sourcePath, "*"))

    // Create commit with version
    await this.git.commit(`Added version ${version}`)

    // Create tag for the version
    await this.git.addTag(version)
  }

  async push(): Promise<void> {
    await this.git.push()
    await this.git.pushTags()
  }

  /* Move the .git folder from the `from` folder to the `to` folder, as
   * well as the README.md file. Also, recreate the .git instance using the
   * updated path.
   */
  async moveGitAndReadmeMd(from: string, to: string): Promise<void> {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to, { recursive: true })
    }

    // Move .git folder
    const gitFolderSource = path.join(from, ".git")
    const gitFolderDest = path.join(to, ".git")

    // If source .git folder doesn't exist, exit
    if (!fs.existsSync(gitFolderSource)) {
      console.error("No .git folder found in the source directory")
      return
    }

    // If destination .git already exists, remove it
    if (fs.existsSync(gitFolderDest)) {
      fs.rmSync(gitFolderDest, { recursive: true, force: true })
    }

    // Move the .git folder
    fs.renameSync(gitFolderSource, gitFolderDest)

    // Move README.md file
    const readmeSource = path.join(from, "README.md")
    const readmeDest = path.join(to, "README.md")

    if (!fs.existsSync(readmeSource)) {
      console.error("No README.md file found in the source directory")
      return
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
