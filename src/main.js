require('dotenv').config();

const WebSocket = require('ws')
const postReaction = require('./postReaction')
const ocr = require('./cropper')
const postInteraction = require('./interaction')
const fs = require('fs')

const ws = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=json')

const {
  accessToken,
  allNameInSeries,
  seriesList,
  namesList,
  channels,
  dynamicNameList
} = require('../config')

ws.on('open', () => {
  ws.send(`{"op":2,"d":{"token":"${accessToken}","capabilities":1021,"properties":{"os":"Linux","browser":"Firefox","device":"","system_locale":"en-US","browser_user_agent":"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0","browser_version":"104.0","os_version":"","referrer":"https://www.google.com/","referring_domain":"www.google.com","search_engine":"google","referrer_current":"","referring_domain_current":"","release_channel":"stable","client_build_number":147616,"client_event_source":null},"presence":{"status":"online","since":0,"activities":[],"afk":false},"compress":false,"client_state":{"guild_hashes":{},"highest_last_message_id":"0","read_state_version":0,"user_guild_settings_version":-1,"user_settings_version":-1}}}`)

  channels.forEach(({ guildId, channelId }) => {
    ws.send(`{"op":14,"d":{"guild_id":"${guildId}","typing":true,"threads":true,"activities":true,"members":[],"channels":{"${channelId}":[[0,99]]},"thread_member_lists":[]}}`)
  })
})

const now = () => (new Date - 0)
const nowString = () => ((new Date).toISOString().slice(0,16).replace(/T/g," "))

let LastDrop = now()
let LastClickAt
let NextGrabAt

let SessionId
let UserId
let LastSequence

const grabLatency = () => (Math.random() * 70)
const canGrab = () => (
  (!NextGrabAt || NextGrabAt < now())
  &&
  (!LastClickAt || now() - LastClickAt > 20_000)
)

const space = "                                                      "
const emojiDrop = '🪧 '
const emojiGrab = '👉'
const emojiGrabbed = '🟢'
const emojiMiss = '🟠'
const emojiBeated = '😡'
const emojiWait = '🕐'
const logDrop =    (cards) => { console.log(`${emojiDrop} Dropping:        `.slice(0, 17), cards.join(' '));  fs.appendFile('./drops.txt', `${nowString()}: ${cards.join(' ')}\n`, () => {}) }
const logGrab =    (card) =>  { console.log(`${emojiGrab} Grabbing:        `.slice(0, 16), card) }
const logGrabbed = (card) =>  { console.log(`${emojiGrabbed} Grabbeb:      `.slice(0, 16), card);             fs.appendFile('./grabbed.txt', `${nowString()}: ${card}\n`, () => {}) }
const logMiss =    (card) =>  { console.log(`${emojiMiss} Missed:          `.slice(0, 16), card); logWait();  fs.appendFile('./missed.txt', `${nowString()}: ${card}\n`, () => {}) }
const logBeated =  (card) =>  { console.log(`${emojiBeated} Beated:        `.slice(0, 16), card);             fs.appendFile('./beated.txt', `${nowString()}: ${card}\n`, () => {}) }
const logWait =    () =>      { console.log(`${emojiWait} Waiting:         `.slice(0, 16), Math.ceil((NextGrabAt - now()) / 1000 / 60), "minutes") }

const handleUnauthorized = (req) => {
  if (req.status.toString()[0] !== '2') {
    LastClickAt = undefined
  }
}

const grab = async (d, grabType) => { 
  const cards = await ocr(d.attachments[0].url, d.id)
  logDrop(cards.filter(e => e.name && e.serie).map(e => `${e.name} {${e.serie}}${space}`.slice(0, 64)))

  cards.forEach((card, index) => {
    if (card === '') { return ; }

    const forceTake = allNameInSeries && allNameInSeries.filter(c => card.serie?.includes(c)).length !== 0

    if (!forceTake) {
      if (seriesList?.filter(c => card.serie?.includes(c)).length === 0) { return ; }

      const inNameList = namesList?.filter(c => card.name?.includes(c)).length !== 0
      const inDynamicNameList = JSON.parse(fs.readFileSync(dynamicNameList)).filter(c => card.name?.includes(c)).length !== 0

      if (!inNameList && !inDynamicNameList) { return }
    }

    const cardDescription = `${card.name} {${card.serie}}`

    if (grabType === 'reaction') {
      setTimeout(() => {
        if (!canGrab()) {
          logMiss(cardDescription)
          return
        }
        LastClickAt = now()
        logGrab(cardDescription)

        postReaction({
          number: index + 1,
          channelId: d.channel_id,
          messageId: d.id,
          accessToken: accessToken
        }).then(handleUnauthorized)
      }, grabLatency() + (1 + index) * 700)
    } else if (grabType === 'interaction') {
      setTimeout(() => {
        if (!canGrab()) {
          logMiss(cardDescription)
          return
        }
        logGrab(cardDescription)
        LastClickAt = now()

        postInteraction({
          accessToken: accessToken,
          messageId: d.id,
          sessionId: SessionId,
          guildId: d.guild_id,
          nonce: Math.round(974219620468 + Math.random() * 20000) << 20,
          customId: d.components[0].components[index].custom_id,
          channelId: d.channel_id,
        }).then(handleUnauthorized)
      }, grabLatency())
    }
  })
}

const handleWait = (d) => {
  const matchWait = d.content.split(/\n/).filter((line) => (
    line.includes("you must wait") && line.includes(`<@${UserId}>`)
  ))[0]

  if (matchWait) {
    if (!matchWait.includes('minutes')) {
      NextGrabAt = now() + 70_000
    }
    for (let i = 1; i < 10; i += 1) {
      if (matchWait.includes(`${i} minutes`)) {
        NextGrabAt = now() + 70_000 * i
        break
      }
    }
    logWait()
  }
}

const handleTook = (d) => {
  const matchTook = d.content.split(/\n/).filter((line) => (
    line.includes("took the") && line.includes(`<@${UserId}>`)
  ))[0]

  if (matchTook) {
    const card = matchTook.split("took the ")[1].split(" card")[0].split('**')[1]
    const grabbed = matchTook.startsWith(`<@${UserId}> took the`) || matchTook.startsWith(`<@${UserId}> fought`)

    if (grabbed) {
      NextGrabAt = now() + 70_000 * 10
      logGrabbed(card)

      const parsedDynamicNameList = JSON.parse(fs.readFileSync(dynamicNameList))
      if (parsedDynamicNameList.find(c => card.name.includes(c))) {
        fs.writeFileSync(parsedDynamicNameList.filter(c => !card.name.includes(c)))
      }
    } else {
      NextGrabAt = now() + 70_000
      logBeated(card)
    }
  }
}

ws.on('message', (data) => {
  const {t, op, d, s} = JSON.parse(data)
  LastSequence = s

  if (t === "READY") {
    SessionId = d.session_id
    UserId = d.user.id
    return
  }
  if (s > 2 && (!SessionId || !UserId)) {
    console.error("Authentication failed")
    process.exit(1)
  }
  if (op === 10) {
    heartbeat(d.heartbeat_interval)
    return
  }

  if (d?.author?.username !== "Karuta") { return }

  const currentChannel = channels.filter(channel => channel.channelId === d.channel_id)[0]
  if (!currentChannel) { return }

  const isDrop = d.content && (d.content.includes("is dropping ") || d.content.includes("I'm dropping"))
  if (isDrop) { 
    LastDrop = now()
  }

  if (t === "MESSAGE_CREATE") {
    if (isDrop && currentChannel.grabType === 'reaction') {
      grab(d, currentChannel.grabType)
      return
    }

    handleWait(d)
    handleTook(d)
  }

  if (
    t === 'MESSAGE_UPDATE'
    && isDrop
    && currentChannel.grabType === 'interaction'
    && d.components.length === 1
    && d.components[0].type === 1
    && d.components[0].components.length >= 3
  ) {
    grab(d, currentChannel.grabType)
  }
})

const heartbeat = (ms) => {
  return setInterval(() => {
    ws.send(JSON.stringify({op: 1, d: LastSequence}))
  }, ms)
}

setInterval(() => {
  if (now() - LastDrop > 1000 * 60 * 10 || now() - LastClickAt > 1000 * 60 * 20) {
    process.exit(1);
  }
})
