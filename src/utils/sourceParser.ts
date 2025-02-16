import axios from "axios"
import { load } from "cheerio"

interface SourceArchive {
  version: string
  url: string
  date: Date
}

export async function getSourceArchives(): Promise<SourceArchive[]> {
  const response = await axios.get("https://vivaldi.com/source/")
  const $ = load(response.data)
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
