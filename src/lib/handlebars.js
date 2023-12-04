const timeago = require('timeago.js');
const timeagoInstance = timeago();
const express = require('express');
const exphbs = require('express-handlebars');

const app = express();

const hbs = exphbs.create({
  helpers: {
    if_eq: function (a, b, opts) {
      return a === b ? opts.fn(this) : opts.inverse(this);
    },
  },
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Resto de la configuración de tu aplicación...

const helpers = {};

helpers.timeago = (savedTimestamp) => {
    return timeagoInstance.format(savedTimestamp);
};

module.exports = helpers;