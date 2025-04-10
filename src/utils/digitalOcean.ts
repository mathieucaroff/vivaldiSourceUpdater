import { config } from "../config"

const BASE_URL = "https://api.digitalocean.com/v2"
const headers = {
  Authorization: `Bearer ${config.digitalOcean.apiToken}`,
  "Content-Type": "application/json",
}

export interface DropletInfo {
  id: string
  ipv4: string
}

export async function createInstance(): Promise<DropletInfo> {
  const response = await fetch(`${BASE_URL}/droplets`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "vivaldi-source-updater",
      region: "fra1",
      size: "gd-8vcpu-32gb",
      image: "ubuntu-20-04-x64",
      ssh_keys: [config.digitalOcean.sshKeyId],
      tags: ["vivaldi-source-updater"],
    }),
  })

  const data = await response.json()
  return data.droplet
}

export async function deleteInstance(dropletId: string) {
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

/**
 * Given a dropletId, try to connect to the droplet through SSH until it accepts
 * the connection. Throw if the maxRetryCount is exceeded.
 */
export async function awaitInstanceReady(
  dropletInfo: DropletInfo,
  retryPeriodMs: number,
  maxRetryCount: number
) {
  // TODO
  // First wait for the droplet to have an IP
  // Then wait for SSH to be ready
}

/**
 * Given a dropletId, periodically list the droplets until it is no longer
 * listed. Throw if the maxRetryCount is exceeded.
 */
export async function awaitInstanceDeletion(
  dropletId: string,
  retryPeriodMs: number,
  maxRetryCount: number
) {
  // TODO
}
