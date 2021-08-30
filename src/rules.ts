import { TwitterApi, UserV1 } from 'twitter-api-v2'

export default async function defineBotRules(client: TwitterApi, user: UserV1) {
  // Get and delete old rules if needed
  const rules = await client.v2.streamRules()
  if (rules.data.length) {
    await client.v2.updateStreamRules({
      delete: { ids: rules.data.map(rule => rule.id) },
    })
  }

  // Add ça va? rules (+ listen mentions)
  await client.v2.updateStreamRules({
    add: [{
      value: '"ça va ?"',
    }, {
      value: '"ca va ?"',
    }, {
      value: '@' + user.screen_name,
    }],
  })
}
