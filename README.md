# Source Code API  [![codecov](https://codecov.io/gh/SourceCodeOER/sourcecode_api/branch/master/graph/badge.svg)](https://codecov.io/gh/SourceCodeOER/sourcecode_api) [![Greenkeeper badge](https://badges.greenkeeper.io/SourceCodeOER/sourcecode_api.svg)](https://greenkeeper.io/) ![](https://github.com/SourceCodeOER/sourcecode_api/workflows/Source%20Code%20Tests/badge.svg) ![](https://github.com/SourceCodeOER/sourcecode_api/workflows/Source%20Code%20CI%2FCD/badge.svg) ![](https://github.com/SourceCodeOER/sourcecode_api/workflows/Github%20pages/badge.svg)
> the new open source catalogue of computer exercises

Like Open Educational Resources, Source Code offers the possibility for educational teams to
collaborate on the problem of creating and sharing exercises.  
The latter consists in referencing IT resources, by allowing a diverse audience to benefit from all contributions.  
As the catalogue expands, it will become an essential resource for all.

## Requirements

- PostgreSQL 12
- Node.js 10+ 

## Documentation

For more examples and API details, see [API documentation](https://sourcecodeoer.github.io/sourcecode_api/) ([or build it yourself !](#how-to-generate--))

## Set up

1. Install dependencies

```
npm install
```

2. Creates a database (settings are stored in `config/config.json`)
```
npx sequelize db:create
```

3. Creates the schema `exercises_library` in this database and  
   Apply all Sequelize migrations to let Sequelize initialize your models in database : 
```
npm run setUp
```

## How do I populate the database quickly with my exercises ? 

This API is delivered with a very complete [CLI tool](https://github.com/SourceCodeOER/cli) to handle the different possible situations. You will find more information on its [documentation](https://github.com/SourceCodeOER/cli/blob/master/README.md).

## Starting the API

```
npm start
```

This will start the API that you reach on [http://localhost:3000](http://localhost:3000).

## How to generate ... ?

### Clients

Using [openapi-generator](https://openapi-generator.tech/) :

```
npx openapi-generator generate -g typescript-axios -i api.yml -o out
```

### Documentation

Using [redoc-cli](https://github.com/Redocly/redoc):

```
npx redoc-cli bundle api.yml -o docs/index.html
```

### How to validate API documentation ?

Using [openapi-generator](https://openapi-generator.tech/) :
```
npx openapi-generator validate -i api.yml
```

### A single yaml file that contains all the API (Useful for Postman for instance) ?

Using [speccy](https://github.com/wework/speccy) : 
```
npx speccy resolve api.yml -o spec-output.yaml
```

## Environment variables

You can customize some parts of the API using the following environment variables :  

| Environment variable name  | Purpose | Default value |
|---|---|---|
| PORT   | The port to use for the API | 3000  |
| SECRET_PHRASE | The secretOrPrivateKey for [jwt.sign](https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback)  | "Super secured passphrase"   |
| DEBUG  | To print relevant logs using [debug](https://www.npmjs.com/package/debug). Currently, you have the following choices : <br/> <br/> - `sourcecode_api:error_handler` : Print all errors <br/> - `sourcecode_api:error_tracker` : Print only failed requests errors <br/> - `sourcecode_api:files` : Print only files that couldn't deleted <br/> - `sequelize:*` : Print [sequelize](https://www.npmjs.com/package/sequelize) logs <br/> ...  |   |
|   |   |   |
