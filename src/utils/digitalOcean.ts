import axios from "axios"
import { config } from "../config"

const api = axios.create({
  baseURL: "https://api.digitalocean.com/v2",
  headers: { Authorization: `Bearer ${config.digitalOcean.apiToken}` },
})

export async function createInstance() {
  const response = await api.post("/droplets", {
    name: "vivaldi-source-updater",
    region: "fra1",
    size: "c-4",
    image: "ubuntu-20-04-x64",
    ssh_keys: [config.digitalOcean.sshKeyId],
    tags: ["vivaldi-source-updater"],
  })

  return response.data.droplet
}

export async function deleteInstance(dropletId: number) {
  await api.delete(`/droplets/${dropletId}`)
}

export async function listInstances() {
  const response = await api.get("/droplets", {
    params: { tag_name: "vivaldi-source-updater" },
  })
  return response.data.droplets
}
