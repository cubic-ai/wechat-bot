FROM node
WORKDIR /usr/src/wechat-bot
COPY package*.json ./
RUN npm i
COPY . .
CMD ["npm", "start"]