const express = require('express');
const app = express();

// Middleware using app.use()
app.use((req, res, next) => {
    console.log('Middleware 1: Logging request');
    next();
});

app.use('/user', (req, res, next) => {
    console.log('Middleware 2: Logging request to /user');
    next();
});

// Route using app.route()
app.route('/user')
    .get((req, res) => {
        res.send('Get a user');
    })
    .post((req, res) => {
        res.send('Add a user');
    })
    .put((req, res) => {
        res.send('Update a user');
    });

// Route using app.get()
app.get('/', (req, res) => {
    res.send('Hello World');
});

// Server setup
const server = app.listen(8080, () => {
    console.log('Listening at port 8080');
});
