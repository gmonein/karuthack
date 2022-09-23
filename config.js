module.exports = {
  accessToken: process.env.DISCORD_ACCESS_TOKEN,
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
  ],
  allNameInSeries: [],
  seriesList: ["Pokémon", "Pokemon",  "Pokgmon", "One Piece", "Attack On Titan", "Vinland Saga", "Death Note", "Berserk", "Naruto", "Buruto", "Fullmetal", "Alchemist", "Gintama", "Code Geass", "Tokyo Ghoul"],
  dynamicNameList: './dynamicGrabList.json',
  namesList: [
    "Luffy", "Zoro", "Roronoa", "Nami", "Usopp", "Sanji", "Vinsmoke", "Chopper", "Nico Robin", "Franky", "Brook",
    "Yeager", "Eren",
    "Thorfinn",
    "Light", "Yagami",
    "Guts",
    "Naruto", "Buruto",
    "Edward", "Elric",
    "Gintoki", "Sakata",
    "Lamperouge", "Lelouch",
    "Kaneki", "Ken",
  ],
};
