import { createHash, createHmac } from "crypto"
import { readFileSync } from "fs"
import { resolve } from "path"

type TelegramUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

function loadDotEnv() {
  const envPath = resolve(__dirname, "..", ".env")
  try {
    const content = readFileSync(envPath, "utf8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) {
        process.env[key] = value
      }
    }
  } catch {
    // ignore missing .env
  }
}

function generateInitData(user: TelegramUser, authDate: number) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set")
  }

  const params = new URLSearchParams()
  params.set("user", JSON.stringify(user))
  params.set("auth_date", String(authDate))
  params.set("query_id", `dev-${user.id}-${authDate}`)

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n")

  const secretKey = createHash("sha256").update(botToken).digest()
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex")
  params.set("hash", hash)

  return params.toString()
}

function envUser(prefix: string): TelegramUser | null {
  const idRaw = process.env[`${prefix}_ID`]
  if (!idRaw) return null
  const id = Number(idRaw)
  if (!Number.isFinite(id)) return null
  return {
    id,
    first_name: process.env[`${prefix}_FIRST_NAME`] ?? "Test",
    last_name: process.env[`${prefix}_LAST_NAME`] ?? undefined,
    username: process.env[`${prefix}_USERNAME`] ?? undefined,
  }
}

function main() {
  loadDotEnv()
  const adminUser = envUser("DEV_TELEGRAM_ADMIN")
  const regularUser = envUser("DEV_TELEGRAM_USER")

  if (!adminUser || !regularUser) {
    console.log("Set env vars in server-hanna/.env:")
    console.log("DEV_TELEGRAM_ADMIN_ID=123")
    console.log("DEV_TELEGRAM_ADMIN_FIRST_NAME=Admin")
    console.log("DEV_TELEGRAM_ADMIN_LAST_NAME=User")
    console.log("DEV_TELEGRAM_ADMIN_USERNAME=admin")
    console.log("DEV_TELEGRAM_USER_ID=456")
    console.log("DEV_TELEGRAM_USER_FIRST_NAME=User")
    console.log("DEV_TELEGRAM_USER_LAST_NAME=Test")
    console.log("DEV_TELEGRAM_USER_USERNAME=user")
    return
  }

  const authDate = Math.floor(Date.now() / 1000)
  const adminInitData = generateInitData(adminUser, authDate)
  const userInitData = generateInitData(regularUser, authDate)

  console.log("Admin initData:")
  console.log(adminInitData)
  console.log("")
  console.log("User initData:")
  console.log(userInitData)
}

main()
