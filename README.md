# Karuta grabbing bot

A Karuta discord grabbing bot

![image](https://user-images.githubusercontent.com/20827160/191590289-3b058224-f5a5-43f9-b7c5-5a84948e5b80.png)

## Instalation

### Without docker

Install node-14

Install tesseract ocr
```bash
  sudo apt install tesseract-ocr
```

install image magick
```base
  sudo apt install imagemagick
```

install packages
```
  npm install
```

## Configuration

Open `config.js`

```
{
  accessToken: string                   # Your discord accessToken
  searchList: Array<string>             # The list of searched series`
  channels: Array<{
    name?: string                       # discord channel name, optional
    guildId: string                     # discord Server/Guild id, can be found in typing request
    channelId: string                   # discord channel id, can be found in typing request
    grabType: 'interaction'|'reaction'  # Use 'reaction' if grab work with emojie, 'interaction' if grab work with buttons
  }>                                    # List of scanned channels
}
```

Get your accessToken in a "typing" request

```
  1 - Via a web browser go to https://discord.com/channels/648031568756998155/648033099317248001 (Karuta official server)
  2 - Open channel "karuta-main-1"
  3 - Inspect page (Ctrl + Shift + i)
  4 - Open "Network" panel
  5 - Type a message
  7 - Typing request will appear, click on it to see details
  8 - In "Network" -> "Typing" -> "Headers" -> "Request Headers" find the "Authorization" header
  9 - Copy the value, this is your accessToken, do not share it !
```

Get guildId and channelId in the channel url
```
  https://discord.com/channels/:guild_id/:channel_id
```

## Usage

### Docker

```bash
  docker build -t karuta .
  docker run karuta
```

### Without Docker

```
  ./run.sh
```
