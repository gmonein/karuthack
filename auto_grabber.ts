import KarutaClient from './src/KarutaClient'
import { config as dotenvConfig } from 'dotenv'
import * as fs from 'fs'

dotenvConfig()
if (!process.env.DISCORD_ACCESS_TOKEN) {
  console.error("Missing DISCORD_ACCESS_TOKEN environment variable")
  process.exit(1);
}

const nowString = () => ((new Date).toISOString().slice(0,16).replace(/T/g," "))
const emojiDrop = '🪧 '
const emojiGrab = '👉'
const emojiGrabbed = '🟢'
const emojiMiss = '🟠'
const emojiBeated = '😡'
const emojiWait = '🕐'

const client = new KarutaClient({accessToken: process.env.DISCORD_ACCESS_TOKEN})
const space = "                                                              "
const logWait =    () =>      { console.log(`${emojiWait} Waiting:         `.slice(0, 16), Math.ceil((client.nextGrabTimestamp - Date.now()) / 1000 / 60), "minutes") }
const logDrop =    (cards) => { console.log(`${emojiDrop} Dropping:        `.slice(0, 17), cards.map((c: string) => `${c}${space}`.slice(0, 64)).join(' | '));  fs.appendFile('./logs/drops.txt', `${nowString()}: ${cards.join('\t\t| ')}\n`, () => '') }
const logGrab =    (card) =>  { console.log(`${emojiGrab} Grabbing:        `.slice(0, 16), card) }
const logGrabbed = (card) =>  { console.log(`${emojiGrabbed} Grabbeb:      `.slice(0, 16), card);             fs.appendFile('./logs/grabbed.txt', `${nowString()}: ${card}\n`, () => '') }
const logMiss =    (card) =>  { console.log(`${emojiMiss} Missed:          `.slice(0, 16), card); logWait();  fs.appendFile('./logs/missed.txt', `${nowString()}: ${card}\n`, () => '') }
const logBeated =  (card) =>  { console.log(`${emojiBeated} Beated:        `.slice(0, 16), card);             fs.appendFile('./logs/beated.txt', `${nowString()}: ${card}\n`, () => '') }

const seriesList = ["Pokémon", "Pokemon",  "Pokgmon", "One Piece", "Attack On Titan", "Vinland Saga", "Death Note", "Berserk", "Naruto", "Buruto", "Fullmetal", "Alchemist", "Gintama", "Code Geass", "Tokyo Ghoul"]
const namesList = ["Luffy", "Zoro", "Roronoa", "Nami", "Usopp", "Sanji", "Vinsmoke", "Chopper", "Nico Robin", "Franky", "Brook", "Yeager", "Eren", "Thorfinn", "Light", "Yagami", "Guts", "Naruto", "Buruto", "Edward", "Elric", "Gintoki", "Sakata", "Lamperouge", "Lelouch", "Kaneki", "Ken"]
const dynamicListFile = './resources/missingPokemon.json'

client.websocketConnect()
client.channelSubscribe({ guildId: '648031568756998155', channelId: '648044573536550922' })
client.channelSubscribe({ guildId: '648031568756998155', channelId: '776520559621570621' })
client.channelSubscribe({ guildId: '648031568756998155', channelId: '826968791992500306' })

client.nextClickTimestamp = Date.now()
client.nextGrabTimestamp = Date.now()

client.onTook((card) => {
  const dynamicList = JSON.parse(fs.readFileSync(dynamicListFile).toString())
  const inDynamicNameList = dynamicList.find((c: string) => card.includes(c))

  if (inDynamicNameList) {
    fs.writeFileSync(dynamicListFile, JSON.stringify(dynamicList.filter((c: string) => c !== inDynamicNameList)))
  }

  logGrabbed(card)
})

client.onBeated((card) => { logBeated(card) })
client.onWait(() => { logWait() })

client.onDrop(async (cards, d, t) => {
  if (t === "MESSAGE_CREATE") { logDrop(cards.filter(s => s.name).map(c => `${c.name} {${c.serie}}`)) }

  cards.forEach((card, index) => {
    if (seriesList?.filter(c => card.serie?.includes(c)).length === 0) { return ; }
    const inNameList = namesList?.filter(c => card.name?.includes(c)).length !== 0
    const inDynamicNameList = JSON.parse(fs.readFileSync(dynamicListFile).toString()).find((c: string) => card.name?.includes(c))
    if (!inNameList && !inDynamicNameList) { return }

    client.grabCard({d: d, index}).then(
      () => logGrab(`${card.name} {${card.serie}}`),
      (e) => { (e === 'cooldown') ? logMiss(card.name) : console.error(e) }
    )
  })
})
