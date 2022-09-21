const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = function postInteraction({ accessToken, messageId, sessionId, guildId, nonce, customId, channelId }) {
  return fetch("https://discord.com/api/v9/interactions", {
      "credentials": "include",
      "headers": {
          "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.5",
          "Content-Type": "application/json",
          "Authorization": `${accessToken}`,
          "X-Super-Properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkZpcmVmb3giLCJkZXZpY2UiOiIiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBVYnVudHU7IExpbnV4IHg4Nl82NDsgcnY6MTA0LjApIEdlY2tvLzIwMTAwMTAxIEZpcmVmb3gvMTA0LjAiLCJicm93c2VyX3ZlcnNpb24iOiIxMDQuMCIsIm9zX3ZlcnNpb24iOiIiLCJyZWZlcnJlciI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbiI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZSI6Imdvb2dsZSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoxNDc2MTYsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9",
          "X-Discord-Locale": "en-US",
          "X-Debug-Options": "bugReporterEnabled",
          "Alt-Used": "discord.com",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin"
      },
      "referrer": `https://discord.com/channels/${guildId}/${channelId}`,
      "body": `{\"type\":3,\"nonce\":\"${nonce}\",\"guild_id\":\"${guildId}\",\"channel_id\":\"${channelId}\",\"message_flags\":0,\"message_id\":\"${messageId}\",\"application_id\":\"646937666251915264\",\"session_id\":\"${sessionId}\",\"data\":{\"component_type\":2,\"custom_id\":\"${customId}\"}}`,
      "method": "POST",
      "mode": "cors"
  });
}
