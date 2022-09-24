import * as sharp from 'sharp';
import * as tesseract from 'node-tesseract-ocr';
import * as magik from 'imagemagick';
import * as http from 'https';
import * as fs from 'fs'

const tesseractConfig = {
  oem: 1,
  psm: 6,
  tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwx\" \"yz"
}

const offsetX = 274
const startX = 44
const serieY = 307

const nameX = 44
const nameY = 57
const nameHeight = 47
const nameWidth = 199

const width = 195
const serieHeight = 60

export type Card = {
  name?: string,
  serie?: string;
}

export default async function ocr(url: string, id: string): Promise<Array<Card>> {
  const originalImage = `/tmp/card_${id}.webp`
  const file = fs.createWriteStream(originalImage);

  await new Promise((resolve) => {
    http.get(url, function(response) {
      response.pipe(file);

      file.on("finish", () => {
        file.close(() => { resolve('') });
      });
    })
  })

  await new Promise(resolve => magik.convert([originalImage, '-threshold', '30%', originalImage], resolve))

  const cards: Array<Card> = [{}, {}, {}, {}]
  for (let i = 0; i != 4; i += 1) {
    const outputImage = `/tmp/card_${i}_${id}_s.webp`;
    try {
      await sharp(originalImage).extract({
        left: startX + i * offsetX,
        top: serieY,
        width: width,
        height: serieHeight,
      }).toFile(outputImage)
    } catch { break }

    let cardSerie: string
    try {
      cardSerie = await tesseract.recognize(outputImage, tesseractConfig)
    } catch (e) { console.error(e) ; continue }

    try {
      await sharp(originalImage).extract({
        left: nameX + i * offsetX,
        top: nameY,
        width: nameWidth,
        height: nameHeight,
      }).toFile(outputImage)
    } catch { continue }

    let cardName: string
    try {
      cardName = await tesseract.recognize(outputImage, tesseractConfig)
    } catch (e) { console.error(e) ; continue }

    cards[i] = {
      serie: cardSerie.split("\n").map(e => e.trim()).join(' ').trim(),
      name: cardName.split("\n").map(e => e.trim()).join(' ').trim(),
    };
    (async () => { fs.unlink(outputImage, () => '') })().catch(console.error);
  }
  (async () => { fs.unlink(originalImage, () => '') })().catch(console.error);

  return cards
}
