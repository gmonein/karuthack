const sharp = require('sharp');
const tesseract = require("node-tesseract-ocr")
const tesseractConfig = {
  oem: 1,
  psm: 6,
  tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwx\" \"yz",
  lang: 'eng'
}

const magik = require('imagemagick');

const http = require('https');
const fs = require('fs');

const offsetX = 274
const startX = 44
const serieY = 307
const width = 195

const serieHeight = 60

module.exports = async function ocr(url, id) {
  const originalImage = `tmp/card_${id}.webp`
  const file = fs.createWriteStream(originalImage);

  await new Promise((resolve) => {
    http.get(url, function(response) {
      response.pipe(file);

      file.on("finish", () => {
        file.close(() => { resolve() });
      });
    })
  })

  await new Promise(resolve => magik.convert([originalImage, '-threshold', '30%', originalImage], resolve))

  let cards = ['', '', '', '']
  for (let i = 0; i != 4; i += 1) {
    let outputImage = `tmp/card_${i}_${id}_s.webp`;
    try {
      await sharp(originalImage).extract({
        left: startX + i * offsetX,
        top: serieY,
        width: width,
        height: serieHeight,
      }).toFile(outputImage)
    } catch { break }

    let cardSerie
    try {
      cardSerie = await tesseract.recognize(outputImage, tesseractConfig)
    } catch (e) { console.error(e) ; continue }

    cards[i] = cardSerie.split("\n").map(e => e.trim()).join(' ').trim();
    (async () => { fs.unlink(outputImage, () => {}) })().catch(console.error);
  }
  (async () => { fs.unlink(originalImage, () => {}) })().catch(console.error);

  return cards
}
