/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: JIGAR PATEL
Student ID: 156200214
Date: 2 JUNE 2023
Cyclic Web App URL: https://courageous-pig-coveralls.cyclic.app/
GitHub Repository URL: https://github.com/jiga-rr/WEB322-app

********************************************************************************/ 


const express = require('express');
const app = express();
const storeService = require('./store-service');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/about');
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/views/about.html');
});

app.get('/shop', (req, res) => {
  storeService.getPublishedItems()
    .then(items => res.json(items))
    .catch(err => res.json({ message: err }));
});

app.get('/items', (req, res) => {
  storeService.getAllItems()
    .then(items => res.json(items))
    .catch(err => res.json({ message: err }));
});

app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then(categories => res.json(categories))
    .catch(err => res.json({ message: err }));
});

app.get('*', (req, res) => {
  res.status(404).send('Page Not Found');
});

storeService.initialize()
  .then(() => {
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`Express http server listening on port ${port}`);
    });
  })
  .catch(err => {
    console.error(err);
  });
