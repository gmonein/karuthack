import KarutaClient from './src/KarutaClient'
import { config as dotenvConfig } from 'dotenv'
import * as fs from 'fs'
import { stringify } from 'csv-stringify/sync';

dotenvConfig()

if (process.argv.length < 3) {
  console.error('usage: node pokedex.js user1 user2 user3 ...')
  process.exit(1)
} 
const userIds = process.argv.slice(2)

const usernames = {
  '251760157510467584': 'Sosoft',
  '254346264152506370': 'Hk',
  '982745948117671996': 'droppydrop',
  '983516987533701172': 'slide my WL#0100',
  '981490864058691624': 'luxsyb',
  '247044605785276416': 'Mycose',
  '279334113465335808': 'Tartine',
  '157513015640588288': 'Swirl',
  '303571731828703232': 'Bilou',
}

interface PokemonEntryInterface {
  id: number,
  name: {
    english: string;
    french: string;
  };
}
type PokemonCardType = {
  name: string;
  identifier: string;
  print: number;
  quality: number;
}

type PokemonTableEntryType = {
  id: number;
  cards: Array<PokemonCardType>;
}

const client = new KarutaClient({accessToken: process.env.DISCORD_ACCESS_TOKEN})

const pokedex: Array<PokemonEntryInterface> = JSON.parse(fs.readFileSync('./resources/pokemons.json').toString())

const actionQueue: Array<(() => void)> = []

setInterval(() => {
  if (actionQueue[0]) { actionQueue.shift()() }
}, 1500)

const channel = { guildId: '768922457838846021', channelId: '991673428358746142' }

const endUser = (userId: string) => {
  const pokemonTable: Array<PokemonTableEntryType> = usersPokemonTable[userId]

  fs.writeFileSync(`./resources/pokemonTable${userId}.json`, JSON.stringify(pokemonTable))
  if (doneUserIds.length === userIds.length) {
    const csv = []
    const headers = ["Pokemon"]
    userIds.forEach((userId) => {
      headers.push(usernames[userId] || userId)
    })
    csv.push(headers)
    for (let i = 0; i < 152; i += 1) {
      const row = []

      row.push(pokedex[i].name.english)
      for (let l = 0; l < userIds.length; l += 1) {
        const uid = userIds[l]

        row.push(usersPokemonTable[uid] && usersPokemonTable[uid][i] && usersPokemonTable[uid][i].cards.length || 0)
      }

      csv.push(row)
    }
    fs.writeFileSync('./resources/pokemonTable.csv', stringify(csv))
    process.exit(0)
  }

}

const doneUserIds: Array<string> = []
const usersPokemonTable: {
  [key: string]: Array<PokemonTableEntryType>
} = {}
userIds.forEach(userId => {
  if (fs.existsSync(`./resources/pokemonTable${userId}.json`)) {
    usersPokemonTable[userId] = JSON.parse(fs.readFileSync(`./resources/pokemonTable${userId}.json`).toString())
    doneUserIds.push(userId)
  } else {
    usersPokemonTable[userId] = []
  }
})
client.websocketConnect()
client.channelSubscribe(channel)

client.onCardCollection((d) => {
  const content = d.embeds[0].description
  const userId = content.split('Cards carried by <@')[1].split('>')[0]
  const pokemonTable: Array<PokemonTableEntryType> = usersPokemonTable[userId]
  if (!pokemonTable) { return }

  d.embeds[0].description.split("\n").slice(2).map((e) => {
    const split = e.trim().split("·")
    const name = split[5].split('**')[1]
    const pokedexEntry = pokedex.find(e => name.includes(e.name.english))
    if (!pokedexEntry) { return }

    const identifier = split[0].trim().split("`").slice(1)[0]
    if (pokemonTable[pokedexEntry.id]?.cards?.find((pte: PokemonCardType) => pte.identifier === identifier)) { return }

    const card: PokemonCardType = {
      name: name,
      identifier: identifier,
      print: parseInt(split[3].trim().split("`")[1].slice(1)[0]),
      quality: split[1].split('').filter(e => e === "★").length,
    }
    if (!pokemonTable[pokedexEntry.id-1]) { pokemonTable[pokedexEntry.id-1] = { id: pokedexEntry.id, cards: [] } }

    pokemonTable[pokedexEntry.id-1].cards.push(card)
  })

  const componentNumber = d.components[0].components.length === 4 ? 2 : 1
  if (d.components[0].components && d.components[0].components[componentNumber].custom_id && !d.components[0].components[componentNumber].disabled) {
    actionQueue.push(() => {
      client.postInteraction({
        messageId: d.id,
        guildId: d.guild_id,
        channelId: d.channel_id,
        interactionId: d.components[0].components[componentNumber].custom_id,
      }).catch(console.error)
    })
  } else {
    doneUserIds.push(userId)
    endUser(userId);
  }
})

userIds.forEach(uid => {
  if (!doneUserIds.find(s => s === uid)) {
    actionQueue.push(() => { client.postMesage({ ...channel, content: `kc ${uid} s:pokemon` }).catch(console.error) })
  } else {
    endUser(uid)
  }
})
