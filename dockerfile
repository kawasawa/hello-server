FROM node:14-alpine
WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]
RUN yarn install --network-timeout 600000

COPY . .
RUN yarn build

EXPOSE 8080
ENTRYPOINT [ "yarn", "start" ]
