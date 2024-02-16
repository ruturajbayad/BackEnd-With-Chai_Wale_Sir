require('dotenv').config();
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send("Hello Ruturaj");
})

app.get('/Profile', (req, res) => {
    res.send('<h1>Ruturaj Bayad</h1>')
})

app.listen(process.env.PORT, () => {
    console.log("listening on port " + process.env.PORT);
});