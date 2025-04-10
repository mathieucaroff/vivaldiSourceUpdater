import dotenv from "dotenv"
dotenv.config()

export const config = {
  digitalOcean: {
    apiToken: process.env.DO_API_TOKEN!,
    sshKeyId: process.env.DO_SSH_KEY_ID!,
    sshPrivateKey: process.env.SSH_PRIVATE_KEY!,
  },
  smtp: {
    server: process.env.SMTP_SERVER!,
    port: Number(process.env.SMTP_PORT!),
    username: process.env.SMTP_USERNAME!,
    password: process.env.SMTP_PASSWORD!,
  },
  github: {
    vivaldiRepository: "ric2b/Vivaldi-browser",
    updaterRepository: "mathieucaroff/vivaldiSourceUpdater",
  },
  git: {
    user: {
      name: "Mathieu CAROFF",
      email: process.env.GIT_USER_EMAIL,
    },
  },
}
