import dotenv from "dotenv"
dotenv.config()

export const config = {
  digitalOcean: {
    apiToken: process.env.DO_API_TOKEN ?? "",
    // ID or fingerprint
    sshKeyId: process.env.DO_SSH_KEY_ID ?? "",
    sshPrivateKey: (process.env.SSH_PRIVATE_KEY ?? "").replace(/;/g, "\n"),
  },
  smtp: {
    server: process.env.SMTP_SERVER ?? "",
    port: Number(process.env.SMTP_PORT!),
    username: process.env.SMTP_USERNAME ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
  },
  github: {
    vivaldiRepository: "ric2b/Vivaldi-browser",
    updaterRepository: "mathieucaroff/vivaldiSourceUpdater",
    token: process.env.GH_TOKEN ?? "",
  },
  git: {
    user: {
      name: "Mathieu CAROFF",
      email: process.env.GIT_USER_EMAIL ?? "",
    },
  },
}

export const envString = [
  "DO_API_TOKEN",
  "DO_SSH_KEY_ID",
  "SSH_PRIVATE_KEY",
  "SMTP_SERVER",
  "SMTP_PORT",
  "SMTP_USERNAME",
  "SMTP_PASSWORD",
  "GH_TOKEN",
  "GIT_USER_EMAIL",
]
  .map((name) => {
    let value = process.env[name] || ""
    if (name === "SSH_PRIVATE_KEY") {
      value = value.replace(/\n/g, ";")
    }
    return `${name}='${value}'`
  })
  .join(" ")
