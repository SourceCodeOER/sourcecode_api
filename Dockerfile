FROM node:12-alpine

# Create app directory
WORKDIR /api

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# RUN npm install
# If you are building your code for production
RUN npm ci --only=production

# Bundle app source
COPY . .

# Set to production
ENV NODE_ENV=production

# Notification about what port is going to expose our app.
EXPOSE 3000
#  Command to start our container.
ENTRYPOINT ["npm", "start"]