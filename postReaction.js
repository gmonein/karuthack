const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const one = "1%EF%B8%8F%E2%83%A3"
const two = "2%EF%B8%8F%E2%83%A3"
const three = "3%EF%B8%8F%E2%83%A3"

module.exports = function postReaction({ number, channelId, messageId, accessToken }) {
  if (!number || number < 1 || number > 3) { return ; }
  reaction = one;
  switch(number) {
    case 1:
      reaction = one
      break
    case 2:
      reaction = two
      break
    case 3:
      reaction = three
      break
  }

  return fetch(
    `https://discord.com/api/v9/channels/${channelId}/messages/${messageId}/reactions/${reaction}/%40me?location=Message`, {
      "credentials": "include",
      "headers": {
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Authorization": `${accessToken}`,
        "X-Super-Properties": "eyJvcyI6IkxpbnV4IiwiYnJvd3NlciI6IkZpcmVmb3giLCJkZXZpY2UiOiIiLCJzeXN0ZW1fbG9jYWxlIjoiZW4tVVMiLCJicm93c2VyX3VzZXJfYWdlbnQiOiJNb3ppbGxhLzUuMCAoWDExOyBVYnVudHU7IExpbnV4IHg4Nl82NDsgcnY6MTA0LjApIEdlY2tvLzIwMTAwMTAxIEZpcmVmb3gvMTA0LjAiLCJicm93c2VyX3ZlcnNpb24iOiIxMDQuMCIsIm9zX3ZlcnNpb24iOiIiLCJyZWZlcnJlciI6Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiwicmVmZXJyaW5nX2RvbWFpbiI6Ind3dy5nb29nbGUuY29tIiwic2VhcmNoX2VuZ2luZSI6Imdvb2dsZSIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoxNDc2MTYsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9",
        "X-Discord-Locale": "en-US",
        "X-Debug-Options": "bugReporterEnabled",
        "Alt-Used": "discord.com",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin"
      },
      "referrer": `https://discord.com/channels/648031568756998155/826968791992500306`,
      "method": "PUT",
      "mode": "cors"
    })
}
