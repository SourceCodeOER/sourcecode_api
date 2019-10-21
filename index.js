const express = require('express');
// Express related imports
const bodyParser = require("body-parser");


// other node package imports

import models, { sequelize } from './models';

// additional Express stuff: middleware, routes, ...
const app = express();
app.use(bodyParser.json());

// API part here
API(app, models);

sequelize.sync().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Example app listening on port ${process.env.PORT}!`);
    });
});


