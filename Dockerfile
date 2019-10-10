FROM node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json ./
COPY docker-compose.yml ./
RUN yarn install
EXPOSE 8080
CMD [ "yarn", "start" ]
