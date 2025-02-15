import { JSDOM } from "jsdom"

async function main() {
  let document = new JSDOM().window.document

  let vivaldiResult = await fetch("https://vivaldi.com/source/")
  let vivaldiRoot = document.createElement("div")
  vivaldiRoot.textContent = await vivaldiResult.text()
  let linkList = [
    ...vivaldiRoot.querySelectorAll(
      ".striped.highlight-links > tbody > tr > td > a:not(.checksum)",
    ),
  ]
  let textLinkList = linkList.map((x) => x.textContent)
  console.log(...textLinkList)

  let githubResult = await fetch("https://github.com/ric2b/Vivaldi-browser/commits/master/")
  let githubRoot = document.createElement("div")
  githubRoot.textContent = await githubResult.text()
  let knownVersionList = [...githubRoot.querySelectorAll("[data-pjax='true']")]
  let textKnownVersionList = knownVersionList.map((x) => x.textContent)
  console.log(...textKnownVersionList)
  return { body: "ok" }
}

main()
