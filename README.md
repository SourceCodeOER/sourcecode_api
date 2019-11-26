# Exercises Library API  [![Build Status](https://travis-ci.com/jy95/exercises_library.svg?branch=master)](https://travis-ci.com/jy95/exercises_library)  [![codecov](https://codecov.io/gh/jy95/exercises_library/branch/master/graph/badge.svg)](https://codecov.io/gh/jy95/exercises_library)

description TODO

## Requirements

- PostgreSQL 12
- Node.js 10+ 

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

4. Run the API (only for letting Sequelize initialize your models in database ) 

```
npm start
# after some times
CTRL-C
```

5. Use all seeders in folder `seeders` to feed your database
```
npx sequelize-cli db:seed:all --debug
```
( More info in seeders in [Sequelize docs](https://sequelize.org/master/manual/migrations.html#creating-first-seed) )

## Starting the API

```
npm start
```

This will start the application and create an sqlite database in your app dir.
Just open [http://localhost:3000](http://localhost:3000).

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