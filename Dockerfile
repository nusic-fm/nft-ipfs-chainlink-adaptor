FROM node:14.15.4

# RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /app

# WORKDIR /home/node/app

COPY package*.json ./
# COPY package-lock.json ./
# COPY yarn.lock ./

# USER node

# RUN yarn --frozen-lockfile
RUN npm ci

COPY . .

# COPY --chown=node:node . .

CMD node app.js
