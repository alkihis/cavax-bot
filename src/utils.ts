import { TweetV2SingleStreamResult, TwitterApi } from 'twitter-api-v2'
import fs from 'fs'
import readline from 'readline'
import dotenv from 'dotenv'

export const env = dotenv.parse(fs.readFileSync(__dirname + '/../.env'))
const settingsPath = __dirname + '/../assets/settings.json'

export interface ISettings {
  banned: string[]
  usernamesWhitelist: false | string[]
}

export async function getSettings() {
  return JSON.parse(await fs.promises.readFile(settingsPath, 'utf-8')) as ISettings
}

export function saveSettings(settings: ISettings) {
  return fs.promises.writeFile(settingsPath, JSON.stringify(settings))
}

export function getClient() {
  return new TwitterApi({
    appKey: env.CONSUMER_TOKEN!,
    appSecret: env.CONSUMER_SECRET!,
    accessToken: env.ACCESS_TOKEN!,
    accessSecret: env.ACCESS_SECRET!,
  })
}

export async function loginProcess() {
  const loginClient = new TwitterApi({
    appKey: env.CONSUMER_TOKEN!,
    appSecret: env.CONSUMER_SECRET!,
  })

  console.log('Beginning login process...')

  const firstStep = await loginClient.generateAuthLink('oob')
  console.log(`Please login using ${firstStep.url}`)

  console.log('Enter the PIN code of the logged account:')
  const code = await readNextLineFromStdin()

  const verifierClient = new TwitterApi({
    appKey: env.CONSUMER_TOKEN!,
    appSecret: env.CONSUMER_SECRET!,
    accessToken: firstStep.oauth_token,
    accessSecret: firstStep.oauth_token_secret,
  })

  console.log('Verifying code...')

  const loggedClient = await verifierClient.login(code)
  console.log(`You are now logged as @${loggedClient.screenName}.`)
  console.log(`Access token: ${loggedClient.accessToken}\nAccess secret: ${loggedClient.accessSecret}\nKeep them in good place.`)

  return loggedClient.client
}

function readNextLineFromStdin() {
  const liner = readline.createInterface({ input: process.stdin })

  return new Promise<string>((resolve, reject) => {
    liner.on('line', line => {
      resolve(line.toString().trim())
      liner.removeAllListeners()
      liner.close()
    })
    liner.on('close', reject)
  })
}

export function isPresentInWhitelist(settings: ISettings, tweet: TweetV2SingleStreamResult) {
  if (!settings.usernamesWhitelist) {
    return true
  }

  const authorId = tweet.data.author_id!
  const user = tweet.includes!.users!.find(u => u.id === authorId)

  return !!(user && settings.usernamesWhitelist.includes(user.username.toLowerCase()))
}
