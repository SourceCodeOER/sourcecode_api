# Source Code API  [![Build Status](https://travis-ci.com/jy95/sourcecode_api.svg?branch=master)](https://travis-ci.com/jy95/sourcecode_api)  [![codecov](https://codecov.io/gh/jy95/sourcecode_api/branch/master/graph/badge.svg)](https://codecov.io/gh/jy95/sourcecode_api)
> the new open source catalogue of computer exercises

Like Open Educational Resources, Source Code offers the possibility for educational teams to
collaborate on the problem of creating and sharing exercises.  
The latter consists in referencing IT resources, by allowing a diverse audience to benefit from all contributions.  
As the catalogue expands, it will become an essential resource for all.

## Requirements

- PostgreSQL 12
- Node.js 10+ 

## Documentation

For more examples and API details, see [API documentation](https://jy95.github.io/sourcecode_api/)

## Set up

1. Install dependencies

```
npm install
```

2. Creates a database (settings are stored in `config/config.json`)
```
npx sequelize db:create
```

3. Creates the schema `exercises_library` in this database
```
DROP SCHEMA IF EXISTS exercises_library CASCADE;
CREATE SCHEMA exercises_library;
```

4. Apply all Sequelize migrations to let Sequelize initialize your models in database 

```
npm run migrate:reset 
```

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

## How to validate API documentation ?

Using [openapi-generator](https://openapi-generator.tech/) :
```
npx openapi-generator validate -i api.yml
```