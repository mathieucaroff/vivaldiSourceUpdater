import axios from "axios"
import { readFileSync } from "fs"
import { Client } from "ssh2"
import { setTimeout } from "timers/promises"

// Configuration interface
interface Config {
  apiToken: string
  dropletName: string
  region: string
  size: string
  image: string
  sshKeyId: string
  sshPrivateKeyPath: string
}

// DigitalOcean API response interfaces
interface DropletCreateResponse {
  droplet: {
    id: number
    status: string
    networks: {
      v4: Array<{
        ip_address: string
        type: string
      }>
    }
  }
}

const config: Config = {
  apiToken: process.env.DO_API_TOKEN!,
  dropletName: "my-ts-droplet",
  region: "nyc3",
  size: "s-1vcpu-1gb",
  image: "ubuntu-22-04-x64",
  sshKeyId: process.env.DO_SSH_KEY_ID!,
  sshPrivateKeyPath: process.env.SSH_PRIVATE_KEY_PATH!,
}

// Validate configuration
function validateConfig(config: Config) {
  if (!config.apiToken) throw new Error("DO_API_TOKEN is required")
  if (!config.sshKeyId) throw new Error("DO_SSH_KEY_ID is required")
  if (!config.sshPrivateKeyPath) throw new Error("SSH_PRIVATE_KEY_PATH is required")
}

async function createDroplet(config: Config): Promise<number> {
  const response = await axios.post<DropletCreateResponse>(
    "https://api.digitalocean.com/v2/droplets",
    {
      name: config.dropletName,
      region: config.region,
      size: config.size,
      image: config.image,
      ssh_keys: [config.sshKeyId],
      backups: false,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiToken}`,
      },
    },
  )

  if (!response.data.droplet?.id) {
    throw new Error("Failed to create droplet")
  }

  return response.data.droplet.id
}

async function waitForDropletActive(config: Config, dropletId: number): Promise<void> {
  console.log("Waiting for droplet to become active...")

  while (true) {
    const response = await axios.get<DropletCreateResponse>(
      `https://api.digitalocean.com/v2/droplets/${dropletId}`,
      {
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
        },
      },
    )

    if (response.data.droplet.status === "active") {
      return
    }

    await setTimeout(10000) // Wait 10 seconds between checks
  }
}

async function getDropletIp(config: Config, dropletId: number): Promise<string> {
  const response = await axios.get<DropletCreateResponse>(
    `https://api.digitalocean.com/v2/droplets/${dropletId}`,
    {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
      },
    },
  )

  const ipv4 = response.data.droplet.networks.v4.find((ip) => ip.type === "public")
  if (!ipv4?.ip_address) throw new Error("Failed to get droplet IP")

  return ipv4.ip_address
}

async function waitForSsh(ip: string, port = 22): Promise<void> {
  console.log("Waiting for SSH availability...")
  const startTime = Date.now()
  const timeout = 300000 // 5 minutes timeout

  while (Date.now() - startTime < timeout) {
    try {
      await axios.head(`http://${ip}:${port}`, { timeout: 5000 })
      return
    } catch (error) {
      await setTimeout(5000)
    }
  }

  throw new Error("SSH connection timed out")
}

async function executeRemoteScript(ip: string, privateKeyPath: string): Promise<void> {
  const conn = new Client()

  return new Promise((resolve, reject) => {
    conn
      .on("ready", () => {
        console.log("SSH connection established")

        conn.exec("bash -s", (err, stream) => {
          if (err) reject(err)

          // Here's the script to execute on the remote server
          stream.end(`
          echo "=== System Information ==="
          uname -a
          echo "=== Disk Space ==="
          df -h
          echo "=== Hello from \\$(hostname) ==="
        `)

          stream
            .on("close", () => {
              conn.end()
              resolve()
            })
            .stderr.on("data", (data) => {
              reject(new Error(`SSH error: ${data.toString()}`))
            })
        })
      })
      .connect({
        host: ip,
        port: 22,
        username: "root",
        privateKey: readFileSync(privateKeyPath),
      })
  })
}

async function main() {
  try {
    validateConfig(config)

    console.log("Creating droplet...")
    const dropletId = await createDroplet(config)
    console.log(`Droplet created with ID: ${dropletId}`)

    await waitForDropletActive(config, dropletId)
    const ip = await getDropletIp(config, dropletId)
    console.log(`Droplet IP: ${ip}`)

    await waitForSsh(ip)
    console.log("Executing remote script...")

    await executeRemoteScript(ip, config.sshPrivateKeyPath)
    console.log("Script execution completed successfully")
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
