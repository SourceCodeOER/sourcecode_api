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

# Removes unnecessary files/folders in node modules
# Files
RUN find "$(pwd)/node_modules" -type f \( \
    -name "*.ts" -o \
    -name "*.md" -o \
    -name "*.swp" -o \
    -name "*.tgz" -o \
    -name ".npm*" -o \
    -name "LICENSE" -o \
    -name "AUTHORS" -o \
    -name "CONTRIBUTORS" -o \
    -name "CHANGES" -o \
    -name ".DS_Store" -o \
    -name ".babelrc" -o \
    -name "jest.config.js" -o \
    -name "tslint.json" -o \
    -name "eslint" -o \
    -name ".eslintrc.js" -o \
    -name ".eslintrc.json" -o \
    -name ".eslintrc.yml" -o \
    -name ".prettierrc*" -o \
    -name ".travis.yml" -o \
    -name ".gitlab-ci.yml" -o \
    -name "appveyor.yml" -o \
    -name ".coveralls.yml" \
\) -exec rm -f {} \;

# Folders
RUN find "$(pwd)/node_modules" -type d \( \
    -name "docs" -o \
    -name "doc" -o \
    -name "tests" -o \
    -name "test" -o \
    -name "__tests__" -o \
    -name "example" -o \
    -name "examples" -o \
    -name ".nyc_output" -o \
    -name ".idea" -o \
    -name ".vscode" -o \
    -name "coverage" -o \
    -name ".github" -o \
    -name ".circleci" \
\) -prune -exec rm -rf {} +;

# Set to production
ENV NODE_ENV=production

# Notification about what port is going to expose our app.
EXPOSE 3000
#  Command to start our container.
CMD ["npm", "start"]
