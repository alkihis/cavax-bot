import { ETwitterStreamEvent, TweetV2 } from 'twitter-api-v2'
import defineBotRules from './rules'
import { env, getClient, getSettings, ISettings, isPresentInWhitelist, loginProcess, saveSettings } from './utils'


if (env.START_MODE === 'login') {
  loginProcess()
} else if (env.START_MODE === 'bot') {
  main()
} else {
  console.log('Unknown start mode. Define START_MODE to "login" or "bot".')
}

async function main() {
  const client = getClient()
  const appClient = await client.appLogin()

  console.log('Fetching bot user.')
  const meAsUser = await client.currentUser()
  const settings = await getSettings()

  console.log('Defining stream rules.')
  await defineBotRules(appClient, meAsUser)

  console.log('Connecting to stream.')
  const stream = await appClient.v2.searchStream({
    'tweet.fields': ['referenced_tweets', 'author_id', 'in_reply_to_user_id', 'entities'],
    expansions: ['referenced_tweets.id', 'author_id'],
  })
  stream.autoReconnect = true

  console.log('Listening to stream. Tweets will follow :)')
  stream.on(ETwitterStreamEvent.Data, async tweet => {
    // Ignore RTs or self-sent tweets
    const isARt = tweet.data.referenced_tweets?.some(tweet => tweet.type === 'retweeted') ?? false
    if (
      isARt ||
      tweet.data.author_id === meAsUser.id_str ||
      settings.banned.includes(tweet.data.author_id!) ||
      !isPresentInWhitelist(settings, tweet)
    ) {
      return
    }

    console.log('Tweet from user', tweet.includes!.users!.find(u => u.id === tweet.data.author_id)?.username)
    if (tweet.data.in_reply_to_user_id === meAsUser.id_str) {
      onReplyToMe(tweet.data, settings)
    } else if (tweet.data.entities?.mentions?.some(m => m.username === meAsUser.screen_name)) {
      // Mention but not a direct reply, ignore
    } else {
      onCaVa(tweet.data)
    }
  })

  async function onReplyToMe(tweet: TweetV2, settings: ISettings) {
    if (tweet.text.match(/\bstop\b/i)) {
      settings.banned.push(tweet.author_id!)
      await saveSettings(settings)
    }
    // Do nothing
  }

  async function onCaVa(tweet: TweetV2) {
    const text = tweet.text.toLowerCase()
    const allowed = ['ca va', 'ça va', 'sa va']
    if (!allowed.some(allow => text.includes(allow))) {
      // sometimes, replies to ca va tweets are included
      return
    }

    console.log(`Will reply ça vax to ${tweet.id} (https://twitter.com/i/statuses/${tweet.id}): ${tweet.text}`)
    await client.v1.reply('Ça va ? Ça vax !!', tweet.id)
  }
}

process.on('unhandledRejection', rejection => {
  console.error('ERROR, UNHANDLED REJECTION')
  console.log(rejection)
})
