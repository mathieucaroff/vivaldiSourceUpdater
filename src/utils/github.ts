import { config } from "../config"

export async function getLastRepositoryVersion() {
  const query = `query ($repositoryOwner: String!, $repositoryName: String!) {
    repository(owner: $repositoryOwner, name: $repositoryName) {
      defaultBranchRef {
        target {
          ... on Commit {
            messageHeadline
          }
        }
      }
    }
  }`

  const [repositoryOwner, repositoryName] = config.github.vivaldiRepository.split('/')

  const response = await fetch("https://api.github.com/graphql", {
    method: 'POST',
    headers: {
        "Authorization": `Bearer ${config.github.token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      variables: {
        repositoryOwner,
        repositoryName,
      },
    })
  })
  const content = await response.json()

  const message = content.data.repository.defaultBranchRef.target.messageHeadline
  const version: string = message.replace(/^[^0-9.]*([0-9.]+)[^0-9.]*$/, "$1")

  return version
}