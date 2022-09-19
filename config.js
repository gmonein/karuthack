module.exports = {
  accessToken: process.env.DISCORD_ACCESS_TOKEN,
  searchList: ["Pokémon", "Pokemon",  "Pokgmon", "One Piece"],
  channels: [
    {
      name: 'Karuta-main-1',
      guildId: '648031568756998155',
      channelId: '776520559621570621',
      grabType: 'interaction',
    },
    {
      name: 'Karuta-main-2',
      guildId: '648031568756998155',
      channelId: '648044573536550922',
      grabType: 'interaction',
    },
    {
      name: 'Karuta-main-3',
      guildId: '648031568756998155',
      channelId: '826968791992500306',
      grabType: 'reaction',
    }
  ]
};
