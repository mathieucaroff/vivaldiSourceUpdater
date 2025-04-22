import fs from "fs"
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

/**
 * @returns List of droplets with the tag "vivaldi-source-updater"
 */
export async function listInstances() {
  const response = await fetch(`${BASE_URL}/droplets?tag_name=vivaldi-source-updater`, {
    headers,
  })
  const data = await response.json()
  return data.droplets
}

/**
 * @param dropletId The Digital Ocean ID of the droplet to get the IP address for
 * @returns The IP address of the droplet, or an empty string if it has no IP address
 * @throws An error if the droplet ID is unknown
 */
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

export function setupSSHKey() {
  const { sshPrivateKey } = config.digitalOcean
  fs.writeFileSync(`${process.env.HOME}/.ssh/id_rsa`, sshPrivateKey, { mode: 0o600 })
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
  let instanceIp = ""
  let retryCount = 0
  console.log(`Waiting for instance ${dropletId} to have an IP...`)
  while (retryCount < maxRetryCount && !instanceIp) {
    instanceIp = await getInstanceIp(dropletId)

    if (!instanceIp) {
      retryCount++
      await new Promise((resolve) => setTimeout(resolve, retryPeriodMs))
    }
  }
  if (!instanceIp) {
    throw new Error(`Instance ${dropletId} had no assigned IP after about ${maxRetryCount * retryPeriodMs}ms.`)
  }
  
  console.log(`Waiting for instance ${dropletId} to be reachable through SSH...`)
  let sshReady = false
  while (retryCount < maxRetryCount && !sshReady) {
    try {
      await execAsync(
        `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${instanceIp} "echo 'SSH is ready'"`
      )
      sshReady = true
    } catch (e) {
      retryCount++
      await new Promise((resolve) => setTimeout(resolve, retryPeriodMs))
    }
  }
  if (!sshReady) {
    throw new Error(`Instance ${dropletId} was not reachable via SSH after about ${maxRetryCount * retryPeriodMs}ms.`)
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
  let retryCount = 0
  let instanceFound = true
  while (retryCount < maxRetryCount && instanceFound) {
    const droplets = await listInstances()
    instanceFound = droplets.some((droplet: any) => droplet.id === dropletId)

    if (instanceFound) {
      retryCount++
      await new Promise((resolve) => setTimeout(resolve, retryPeriodMs))
    }
  }

  if (instanceFound) {
    throw new Error(`Instance ${dropletId} was not deleted after ${maxRetryCount} retries.`)
  }
}
