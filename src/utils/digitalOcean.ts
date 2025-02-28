import { config } from "../config"

const BASE_URL = "https://api.digitalocean.com/v2"
const headers = {
  Authorization: `Bearer ${config.digitalOcean.apiToken}`,
  "Content-Type": "application/json",
}

export async function createInstance() {
  const response = await fetch(`${BASE_URL}/droplets`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "vivaldi-source-updater",
      region: "fra1",
      size: "c-4",
      image: "ubuntu-20-04-x64",
      ssh_keys: [config.digitalOcean.sshKeyId],
      tags: ["vivaldi-source-updater"],
    }),
  })

  const data = await response.json()
  return data.droplet
}

export async function deleteInstance(dropletId: number) {
  await fetch(`${BASE_URL}/droplets/${dropletId}`, {
    method: "DELETE",
    headers,
  })
}

export async function listInstances() {
  const response = await fetch(`${BASE_URL}/droplets?tag_name=vivaldi-source-updater`, {
    headers,
  })
  const data = await response.json()
  return data.droplets
}
