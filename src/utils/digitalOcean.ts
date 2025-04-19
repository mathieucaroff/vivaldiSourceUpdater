import { promisify } from "util"
import { config } from "../config"
import { exec } from "child_process"

const execAsync = promisify(exec)

const BASE_URL = "https://api.digitalocean.com/v2"
const headers = {
  Authorization: `Bearer ${config.digitalOcean.apiToken}`,
  "Content-Type": "application/json",
}

function asNumberIfPossible(value: string): number | string {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? value : parsed
}

export async function createInstance(): Promise<number> {
  const response = await fetch(`${BASE_URL}/droplets`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "vivaldi-source-updater",
      region: "fra1",
      size: "gd-8vcpu-32gb",
      image: "ubuntu-24-04-x64",
      ssh_keys: [asNumberIfPossible(config.digitalOcean.sshKeyId)],
      tags: ["vivaldi-source-updater"],
    }),
  })

  const data = await response.json()
  return data.droplet.id
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

export async function getInstanceIp(dropletId: number): Promise<string> {
  const response = await fetch(`${BASE_URL}/droplets/${dropletId}`, { headers })
  const data = await response.json()
  const droplet = data.droplet
  if (!droplet) {
    throw new Error(`Droplet with ID ${dropletId} not found`)
  }
  const ipv4 = droplet.networks.v4.find((network: any) => network.type === "public")
  const ipv6 = droplet.networks.v6.find((network: any) => network.type === "public")
  return ipv4?.ip_address ?? ipv6?.ip_address ?? ""
}

/**
 * Given a dropletId, try to connect to the droplet through SSH until it accepts
 * the connection. Throw if the maxRetryCount is exceeded.
 */
export async function awaitInstanceReady(
  dropletId: number,
  retryPeriodMs: number,
  maxRetryCount: number
): Promise<void> {
  let ipv4 = ""
  let retryCount = 0
  while (retryCount < maxRetryCount && !ipv4) {
    ipv4 = await getInstanceIp(dropletId)

    if (!ipv4) {
      retryCount++
      await new Promise((resolve) => setTimeout(resolve, retryPeriodMs))
    }
  }

  let sshReady = false
  while (retryCount < maxRetryCount && !sshReady) {
    try {
      await execAsync(
        `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${ipv4} "echo 'SSH is ready'"`
      )
      sshReady = true
    } catch (e) {
      retryCount++
      await new Promise((resolve) => setTimeout(resolve, retryPeriodMs))
    }
  }
}

/**
 * Given a dropletId, periodically list the droplets until it is no longer
 * listed. Throw if the maxRetryCount is exceeded.
 */
export async function awaitInstanceDeletion(
  dropletId: number,
  retryPeriodMs: number,
  maxRetryCount: number
) {
  // TODO
}
