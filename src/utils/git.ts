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
    await this.git.commit(`Add Vivaldi source version ${version}`)

    // Create tag for the version
    await this.git.addTag(version)
  }

  async push(): Promise<void> {
    await this.git.push()
    await this.git.pushTags()
  }
}
