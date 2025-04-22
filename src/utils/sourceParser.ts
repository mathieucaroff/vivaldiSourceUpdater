import { load } from "cheerio"

interface SourceArchive {
  version: string
  url: string
  date: Date
}

export async function getSourceArchives(): Promise<SourceArchive[]> {
  const response = await fetch("https://vivaldi.com/source/")
  const html = await response.text()
  const $ = load(html)
  const archives: SourceArchive[] = []

  // The archives are typically in a table with links and dates
  $("table tr").each((_, row) => {
    const cells = $(row).find("td")
    if (cells.length >= 2) {
      const link = $(cells[0]).find("a")
      const url = link.attr("href")
      const version = link.text().trim()
      const dateText = $(cells[1]).text().trim()

      if (url && version && dateText) {
        archives.push({
          version,
          url,
          date: new Date(dateText),
        })
      }
    }
  })

  return archives
}

export async function getNewSourceArchives(
  lastRepositoryVersion: string
): Promise<SourceArchive[]> {
  // Get list of source archives
  const archives = await getSourceArchives()

  // Compare archive versions with lastRepositoryVersion, filter out archives of smaller or equal version
  const newArchives = archives.filter(
    (archive) => isNewerVersion(archive.version, lastRepositoryVersion)
  )

  return newArchives
}

/**
 * Compare two version strings and return true if the first one is strictly newer than the second one.
 * @param a first version string
 * @param b second version string
 * @returns true if a is strictly newer than b, false otherwise
 */
export function isNewerVersion(a: string, b: string): boolean {
  const aPartList = a.split(".")
  const bPartList = b.split(".")

  for (let i = 0; i < Math.max(aPartList.length, bPartList.length); i++) {
    const aa = Number(aPartList[i]) || 0
    const bb = Number(bPartList[i]) || 0

    if (aa > bb) {
      return true
    } else if (aa < bb) {
      return false
    }
  }

  return false
}