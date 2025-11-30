import nodemailer, { type Transporter } from "nodemailer"

type MailRecipient = string | string[]

export interface SendMailOptions {
  to: MailRecipient
  subject: string
  text: string
  html?: string
}

export interface SendMailResult {
  success: boolean
  skipped?: boolean
  error?: string
}

let transporter: Transporter | null = null

const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpSecure = process.env.SMTP_SECURE === "true"
const defaultFrom = process.env.MAIL_FROM || smtpUser

function isEmailConfigured(): boolean {
  return Boolean(smtpHost && smtpPort && defaultFrom)
}

function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) {
    return null
  }

  if (transporter) {
    return transporter
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure || smtpPort === 465,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  })

  return transporter
}

export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  const resolvedTransporter = getTransporter()

  if (!resolvedTransporter) {
    console.warn("[mail] SMTP設定が不足しているためメール送信をスキップします。")
    return { success: false, skipped: true, error: "SMTP configuration is missing" }
  }

  try {
    await resolvedTransporter.sendMail({
      from: defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[mail] メール送信に失敗しました:", message)
    return { success: false, error: message }
  }
}






