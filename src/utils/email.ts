import nodemailer from "nodemailer"
import { config } from "../config"

const transporter = nodemailer.createTransport({
  host: config.smtp.server,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.username,
    pass: config.smtp.password,
  },
})

export async function sendMail(subject: string, body: string) {
  console.log(`[email] ${subject}: ${body}`)

  await transporter.sendMail({
    from: config.smtp.username,
    to: config.smtp.username,
    subject,
    text: body,
  })
}
