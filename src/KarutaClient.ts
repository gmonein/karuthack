import { WebSocket } from 'ws'
import ocr, { Card } from './ocr'

interface InteractionArgumentsType {
  messageId: string;
  guildId: string;
  channelId: string;
  interactionId: string;
}

interface WebSocketMessageD {
  id: string;
  message_id: string;
  user_id: string;
  channel_id: string;
  guild_id: string;
  content?: string;
  session_id?: string;
  heartbeat_interval?: number;
  attachments: Array<{
    url: string;
  }>;
  user?: {
    id: string;
  }
  author?: {
    id: string;
    username: string;
  };
  components?: Array<{
    type: number;
    components?: Array<{
      custom_id: string;
      disabled?: boolean;
    }>
  }>;
  embeds?: Array<{
    description: string;
  }>;
  emoji?: {
    id: string;
    user_id: string;
    name: string;
  }
}

interface WebSocketMessage {
  t: "READY" | "MESSAGE_CREATE" | "MESSAGE_UPDATE" | "MESSAGE_REACTION_ADD";
  s: number;
  op: number;
  d: WebSocketMessageD;
}

interface onDropFunctionInterface {
  (cards: Array<Card>, message: WebSocketMessageD, t: WebSocketMessage['t']): void
}

export default class KarutaClient {
  accessToken: string;
  properties: string;
  sessionId?: string;
  userId?: string;
  websocket: WebSocket;
  websocketLastSequence?: number;
  websocketConnectionPromise?: Promise<boolean>;
  channelsSubscriptions: Array<string>;
  onDropSubscriptions: Array<onDropFunctionInterface>;
  interactionSubscriptions: Array<{
    messageId: string;
    fn: (d: WebSocketMessageD) => void;
  }>;
  reactionSubscriptions: Array<{
    messageId: string;
    emoji: string;
    userId: string;
    fn: (d: WebSocketMessageD) => void;
  }>

  onTookSubscriptions: Array<(card: string) => void>
  onBeatedSubscriptions: Array<(card: string) => void>
  onWaitSubscriptions: Array<() => void>
  onCardCollectionSubscriptions: Array<(d: WebSocketMessageD, t: WebSocketMessage['t']) => void>
  onAlbumSubscriptions: Array<(d: WebSocketMessageD, t: WebSocketMessage['t']) => void>

  nextGrabTimestamp: number
  nextDropTimestamp: number
  nextClickTimestamp: number
  lastMessageTimestamp: number

  KarutaUserId = "646937666251915264"
  Emojies = ['1️⃣', '2️⃣', '3️⃣']

  Debug = false

  constructor({ accessToken }: { accessToken: string }) {
    this.accessToken = accessToken
    this.refreshGrab()
    this.refreshClick()
    this.refreshDrop()

    this.onDropSubscriptions = []
    this.channelsSubscriptions = []
    this.interactionSubscriptions = []
    this.reactionSubscriptions = []
    this.onTookSubscriptions = []
    this.onBeatedSubscriptions = []
    this.onWaitSubscriptions = []
    this.onCardCollectionSubscriptions = []
    this.onAlbumSubscriptions = []
  }

  refreshGrab() { this.nextGrabTimestamp = Date.now() + 60_000 }
  refreshClick() { this.nextClickTimestamp = Date.now() + 5_000 }
  refreshDrop() { this.nextDropTimestamp = Date.now() + 180_000 }

  requestProperties = {
    "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.5",
    "X-Super-Properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkZpcmVmb3giLCJkZXZpY2UiOiIiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBVYnVudHU7IExpbnV4IHg4Nl82NDsgcnY6MTA0LjApIEdlY2tvLzIwMTAwMTAxIEZpcmVmb3gvMTA0LjAiLCJicm93c2VyX3ZlcnNpb24iOiIxMDQuMCIsIm9zX3ZlcnNpb24iOiIiLCJyZWZlcnJlciI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbiI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZSI6Imdvb2dsZSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoxNDc2MTYsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9",
    "X-Discord-Locale": "en-US",
    "X-Debug-Options": "bugReporterEnabled",
    "Alt-Used": "discord.com",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin"
  }

  postMesage({guildId, channelId, content}: { guildId: string, channelId: string, content: string }) { 
    const nonce = Math.round(974219620468 + Math.random() * 20000) << 20

    return fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
      "headers": {
        "authorization": this.accessToken,
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Linux\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-debug-options": "bugReporterEnabled",
        "x-discord-locale": "en-US",
        "x-super-properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkNocm9tZSIsImRldmljZSI6IiIsInN5c3RlbV9sb2NhbGUiOiJlbi1VUyIsImJyb3dzZXJfdXNlcl9hZ2VudCI6Ik1vemlsbGEvNS4wIChYMTE7IExpbnV4IHg4Nl82NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEwNS4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTA1LjAuMC4wIiwib3NfdmVyc2lvbiI6IiIsInJlZmVycmVyIjoiaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS8iLCJyZWZlcnJpbmdfZG9tYWluIjoid3d3Lmdvb2dsZS5jb20iLCJzZWFyY2hfZW5naW5lIjoiZ29vZ2xlIiwicmVmZXJyZXJfY3VycmVudCI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50Ijoid3d3Lmdvb2dsZS5jb20iLCJzZWFyY2hfZW5naW5lX2N1cnJlbnQiOiJnb29nbGUiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoxNDg0NzksImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9"
      },
      "referrer": `https://discord.com/channels/${guildId}/${channelId}`,
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": `{"content":"${content}","nonce":"${nonce}","tts":false}`,
      "method": "POST",
    });
  }

  async postReaction({ channelId, messageId, reaction }: { channelId: string, messageId: string, reaction: string }): Promise<boolean> {
    try {
    const response = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages/${messageId}/reactions/${reaction}/%40me?location=Message`, {
      "headers": {
        "Authorization": this.accessToken,
        ...this.requestProperties,
      },
      "method": "PUT",
    })
    if (response.status.toString()[0] !== '2') {
      if (this.Debug) { console.log('post reac failed', response.status, response.body) }
      throw(false);
    }
    } catch (e) {
      console.error(e)
    }

    return(true);
  }

  async postInteraction({ messageId, guildId, channelId, interactionId }: InteractionArgumentsType): Promise<boolean> {
    const nonce = Math.round(974219620468 + Math.random() * 20000) << 20

    if (!this.sessionId) {
      return new Promise((_resolve, reject) => reject('no sessionId'))
    }

    const response = await fetch("https://discord.com/api/v9/interactions", {
      "credentials": "include",
      "headers": {
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        "Authorization": this.accessToken,
        "X-Super-Properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkZpcmVmb3giLCJkZXZpY2UiOiIiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBVYnVudHU7IExpbnV4IHg4Nl82NDsgcnY6MTA0LjApIEdlY2tvLzIwMTAwMTAxIEZpcmVmb3gvMTA0LjAiLCJicm93c2VyX3ZlcnNpb24iOiIxMDQuMCIsIm9zX3ZlcnNpb24iOiIiLCJyZWZlcnJlciI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbiI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZSI6Imdvb2dsZSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoxNDc2MTYsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9",
        "X-Discord-Locale": "en-US",
        "X-Debug-Options": "bugReporterEnabled",
        "Alt-Used": "discord.com",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin"
      },
        "referrer": `https://discord.com/channels/${guildId}/${channelId}`,
        "body": `{"type":3,"nonce":"${nonce}","guild_id":"${guildId}","channel_id":"${channelId}","message_flags":0,"message_id":"${messageId}","application_id":"646937666251915264","session_id":"${this.sessionId}","data":{"component_type":2,"custom_id":"${interactionId}"}}`,
        "method": "POST",
        "mode": "cors"
    });
    if (response.status.toString()[0] !== '2') {
      if (this.Debug) { console.log('post int failed', response.status, response.body) }
      throw(false);
    }
    return(true);
  }


  onTook(fn: (card: string) => void) { this.onTookSubscriptions.push(fn) }
  onBeated(fn: (card: string) => void) { this.onBeatedSubscriptions.push(fn) }
  onWait(fn: () => void) { this.onWaitSubscriptions.push(fn) }
  onCardCollection(fn: (d: WebSocketMessageD, t: WebSocketMessage['t']) => void) { this.onCardCollectionSubscriptions.push(fn) }
  onAlbum(fn: (d: WebSocketMessageD, t: WebSocketMessage['t']) => void) { this.onAlbumSubscriptions.push(fn) }

  websocketConnect(): Promise<boolean> {
    if (this.websocketConnectionPromise) { return this.websocketConnectionPromise }

    this.websocket = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=json')
    this.websocketConnectionPromise = new Promise((resolve, reject) => {
      this.websocket.on('open', () => {
          this.websocket.send(`{"op":2,"d":{"token":"${this.accessToken}","capabilities":1021,"properties":{"os":"Linux","browser":"Firefox","device":"","system_locale":"en-US","browser_user_agent":"Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0","browser_version":"104.0","os_version":"","referrer":"https://www.google.com/","referring_domain":"www.google.com","search_engine":"google","referrer_current":"","referring_domain_current":"","release_channel":"stable","client_build_number":147616,"client_event_source":null},"presence":{"status":"online","since":0,"activities":[],"afk":false},"compress":false,"client_state":{"guild_hashes":{},"highest_last_message_id":"0","read_state_version":0,"user_guild_settings_version":-1,"user_settings_version":-1}}}`)
      })

      this.websocket.on('message', (data) => {
        const {t, op, d, s}: WebSocketMessage = JSON.parse(data.toString())
        if (t === "READY") { this.sessionId = d.session_id; this.userId = d.user.id; resolve(true); return; }
        if (s > 2 && (!this.sessionId || !this.userId)) { console.error("Authentication failed"); reject('authentication failed'); return; }
        if (op === 10) { this.websocketHeartbeat(d.heartbeat_interval); return; }

        this.lastMessageTimestamp = Date.now()
        this.websocketLastSequence = s

        if (!this.channelsSubscriptions.find(channelId => channelId === d?.channel_id)) { return; }

        if (this.Debug) { console.log(t) }
        if (t === "MESSAGE_CREATE" && d?.author?.username === "Karuta" && d.content && (d.content.includes("is dropping ") || d.content.includes("I'm dropping"))) {
          ocr(d.attachments[0].url, d.id).then((cards) => {
            this.onDropSubscriptions.forEach((fn) => { fn(cards, d, t) })
          }, console.error)
        }

        if (t === "MESSAGE_CREATE" && d?.author?.username === "Karuta") {
          const matchTook = d.content.split(/\n/).filter((line) => ( line.includes("took the") && line.includes(`<@${this.userId}>`)))[0]

          if (matchTook) {
            const card = matchTook.split("took the ")[1].split(" card")[0].split('**')[1]
            const grabbed = matchTook.startsWith(`<@${this.userId}> took the`) || matchTook.startsWith(`<@${this.userId}> fought`)

            if (grabbed) {
              this.refreshGrab()
              this.onTookSubscriptions.forEach(fn => fn(card))
            } else {
              this.onBeatedSubscriptions.forEach(fn => fn(card))
              this.nextGrabTimestamp = Date.now() + 70_000
            }
          }

          const matchWait = d.content.split(/\n/).filter((line) => ( line.includes("you must wait") && line.includes(`<@${this.userId}>`) ))[0]

          if (matchWait) {
            if (!matchWait.includes('minutes')) { this.nextGrabTimestamp = Date.now() }
            else {
              for (let i = 1; i < 10; i += 1) {
                if (matchWait.includes(`${i} minutes`)) {
                  this.nextGrabTimestamp = Date.now() + 60_000 * i
                  break
                }
              }
            }
            this.nextGrabTimestamp = this.nextGrabTimestamp + 60_000
            this.onWaitSubscriptions.forEach(fn => fn())
          }
        }

        if ((t === "MESSAGE_CREATE" || t === "MESSAGE_UPDATE") && d?.author?.username === "Karuta" && d.embeds && d.embeds[0] && d.embeds[0].description.includes("Cards carried by ")) {
          this.onCardCollectionSubscriptions.forEach(fn => fn(d, t))
        }
        if ((t === "MESSAGE_CREATE" || t === "MESSAGE_UPDATE") && d?.author?.username === "Karuta" && d.content.includes("Card Album")) {
          this.onAlbumSubscriptions.forEach(fn => fn(d, t))
        }

        if (t === "MESSAGE_REACTION_ADD") {
          this.reactionSubscriptions.forEach(subscription => {
            if (this.Debug) { console.log('try to resolve reac sub') }
            if (subscription.messageId !== d.message_id || subscription.userId !== d.user_id || d.emoji.name !== subscription.emoji) { return ; }
            if (this.Debug) { console.log('resolved reac sub') }

            subscription.fn(d)
          })
        }

        if (t === "MESSAGE_UPDATE") {
          this.interactionSubscriptions.forEach(subscription => {
            if (subscription.messageId !== d.id) { return ; }

            subscription.fn(d)
          })
        }
      })
    })
    return this.websocketConnectionPromise
  }

  websocketHeartbeat(ms: number) {
    return setInterval(() => {
      if (this.lastMessageTimestamp && this.lastMessageTimestamp < Date.now() - 20_000) { process.exit(0) }

      this.websocket.send(JSON.stringify({op: 1, d: this.websocketLastSequence}))
    }, ms)
  }

  onDrop(fn: onDropFunctionInterface) {
    this.onDropSubscriptions.push(fn)
  }

  channelSubscribe({ guildId, channelId }: { guildId: string, channelId: string }) {
    this.channelsSubscriptions.push(channelId)
    this.websocketConnectionPromise.then(() => {
      this.websocket.send(`{"op":14,"d":{"guild_id":"${guildId}","typing":true,"threads":true,"activities":true,"members":[],"channels":{"${channelId}":[[0,99]]},"thread_member_lists":[]}}`)
    })
  }

  grabCard({ d, index }: { d: WebSocketMessageD, index: number }): Promise<boolean> {
    if (Date.now() < this.nextGrabTimestamp || Date.now() < this.nextClickTimestamp) {
      if (this.Debug) { console.log('cooldowned') }
      return new Promise((_, reject) => reject('cooldown'))
    }
    this.refreshGrab()
    this.refreshClick()

    if (this.Debug) { console.log('grabbing') }
    if (d.components && d.components[0] && d.components[0].type === 1 && d.components[0].components[index]) {
      const promise: Promise<boolean> = new Promise((resolve, reject) => {
        if (d.components[0].components[index].disabled) {
          if (this.Debug) { console.log('int sub grab') }
          this.interactionSubscriptions.push({ messageId: d.id, fn: (d) => {
            if (d.components && d.components[0] && d.components[0].type === 1 && d.components[0].components[index] && !d.components[0].components[index].disabled) {
              this.postInteraction({
                messageId: d.id,
                guildId: d.guild_id,
                channelId: d.channel_id,
                interactionId: d.components[0].components[index].custom_id,
              }).then(resolve, () => reject('interaction query failed'))
            }
          }})
          setTimeout(() => reject('interaction sub timeout'), 5000)
        
          return true
        }

        if (this.Debug) { console.log('int instant grab') }
        this.postInteraction({
          messageId: d.id,
          guildId: d.guild_id,
          channelId: d.channel_id,
          interactionId: d.components[0].components[index].custom_id,
        }).then(resolve, () => reject('reaction query failed')) })
      return new Promise((resolve, reject) => {
        promise.then(resolve, reject).finally(() => {
          if (this.Debug) { console.log('int end sub') }
          this.interactionSubscriptions = this.interactionSubscriptions.filter(subscription => subscription.messageId !== d.id)
        })
      })
    } else {
      const promise: Promise<boolean> = new Promise((resolve, reject) => {
        if (index === 3) { reject('reaction index out of range') }

        if (this.Debug) { console.log('reac sub grab') }
        this.reactionSubscriptions.push({
          messageId: d.id,
          userId: this.KarutaUserId,
          emoji: this.Emojies[index],
          fn: () => {
            this.postReaction({
              channelId: d.channel_id,
              messageId: d.id,
              reaction: this.Emojies[index],
            }).then(resolve, () => reject('post reaction query failed'))
          }
        })
        setTimeout(() => reject('post reaction sub timeout'), 5000)
      })
      return new Promise((resolve, reject) => {
        promise.then(resolve, reject).finally(() => {
          if (this.Debug) { console.log('reac sub end') }
          this.reactionSubscriptions = this.reactionSubscriptions.filter(subscription => subscription.messageId !== d.id)
        })
      })
    }
  }
}
