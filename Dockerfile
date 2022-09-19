FROM node:14

RUN apt update
RUN apt install -y tesseract-ocr
RUN apt install -y imagemagick

WORKDIR app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY . .

ENTRYPOINT ["./run.sh"]
