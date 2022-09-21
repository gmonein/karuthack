require('dotenv').config();

const WebSocket = require('ws')
const ws = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=json')
const pokedex = JSON.parse(require('fs').readFileSync('./resources/pokemons.json'))
const pokemonTableById = JSON.parse(require('fs').readFileSync('./pokemonTableById.json'))
const postInteraction = require('./interaction')
const { accessToken, channels } = {
  accessToken: process.env.DISCORD_ACCESS_TOKEN,
  channels: [
    { guildId: '768922457838846021', channelId: '991673428358746142' }
  ]
}


require('fs').writeFileSync('./missingPokemon.json', JSON.stringify(pokedex.filter(entry => entry.id < 152 && !pokemonTableById[entry.id]).map(entry => entry.name.english)))

let SessionId
let LastSequence

ws.on('open', () => {
  ws.send(`{"op":2,"d":{"token":"${accessToken}","capabilities":1021,"properties":{"os":"Linux","browser":"Firefox","device":"","system_locale":"en-US","browser_user_agent":"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0","browser_version":"104.0","os_version":"","referrer":"https://www.google.com/","referring_domain":"www.google.com","search_engine":"google","referrer_current":"","referring_domain_current":"","release_channel":"stable","client_build_number":147616,"client_event_source":null},"presence":{"status":"online","since":0,"activities":[],"afk":false},"compress":false,"client_state":{"guild_hashes":{},"highest_last_message_id":"0","read_state_version":0,"user_guild_settings_version":-1,"user_settings_version":-1}}}`)

  channels.forEach(({ guildId, channelId }) => {
    ws.send(`{"op":14,"d":{"guild_id":"${guildId}","typing":true,"threads":true,"activities":true,"members":[],"channels":{"${channelId}":[[0,99]]},"thread_member_lists":[]}}`)
  })
})

let Mutex = {
  lock: undefined
}

const lockMutex = () => {
  Mutex.lock = new Promise(resolve => {
    setTimeout(resolve, 3000)
  })
}

const waitMutex = async () => {
  if (!Mutex.lock) { return }
  return await Mutex.lock
}

const handleCardCollection = async (d) => {
  d.embeds[0].description.split("\n").slice(2).map((e) => {
    const split = e.trim().split("·")
    const identifier = split[0].trim().split("`").slice(1)[0]
    const quality = split[1].split('').filter(e => e === "★").length
    const print = parseInt(split[3].trim().split("`").slice(1)[0])
    const name = split[5].split('**')[1]
    const pokedexEntry = pokedex.find(e => name.includes(e.name.english))

    if (!pokedexEntry) { return }
    if (!pokemonTableById[pokedexEntry.id]) { pokemonTableById[pokedexEntry.id] = [] }

    pokemonTableById[pokedexEntry.id].push({ quality, print, name, identifier })
  })

  const nextComponent = d.components[0].components[2]

  if (nextComponent.disabled) {
    console.log(pokemonTableById.length)
    require('fs').writeFileSync('./pokemonTableById.json', JSON.stringify(pokemonTableById))
    process.exit(0)
  }

  await waitMutex()
  postInteraction({
    accessToken: accessToken,
    messageId: d.id,
    sessionId: SessionId,
    guildId: d.guild_id,
    nonce: Math.round(974219620468 + Math.random() * 20000) << 20,
    customId: d.components[0].components[2].custom_id,
    channelId: d.channel_id,
  })
  lockMutex()
}

ws.on('message', (data) => {
  const {t, op, d, s} = JSON.parse(data)

  if (op === 10) {
    heartbeat(d.heartbeat_interval)
    return
  }
  if (t === "READY") {
    SessionId = d.session_id
    return
  }

  LastSequence = s
  const currentChannel = channels.filter(channel => d && channel.channelId === d.channel_id)[0]
  if (!currentChannel) { return }

  if (d.embeds && d.embeds[0]?.title === 'Card Collection'
    && (t === 'MESSAGE_CREATE' || t === 'MESSAGE_UPDATE')
  ) {
    handleCardCollection(d)
    return
  }

  if (
    d.embeds && d.embeds[0]?.title === 'Card Album'
    && (t === 'MESSAGE_CREATE' || t === 'MESSAGE_UPDATE')
  ) {
    const page = d.embeds[0].footer.text.match(/page ([0-9]+)/)[1]
    console.log(`Page ${page}:`)
    for (let i = 0; i < 8; i += 1) {
      const cards = pokemonTableById[((page - 1) * 8 + 1) + i]
      if (!cards) { continue }

      cards.sort((a,b) => (
        ((a.print !== b.print) && b.print - a.print) ||
        ((a.quality !== b.quality) && b.quality - a.quality)
      ))

      const card = cards[0]
      const print = card.print.split("`").slice(1)[0].slice(1)[0]
      console.log(`k!albumcardadd pokedex ${card.identifier} ${page} ${i+1}       ${print} ${card.quality}`)
    }
  }
})

const heartbeat = (ms) => {
  return setInterval(() => {
    ws.send(JSON.stringify({op: 1, d: LastSequence}))
  }, ms)
}
