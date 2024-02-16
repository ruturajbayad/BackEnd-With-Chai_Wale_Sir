require('dotenv').config();
const express = require('express');
const app = express();

// app.get('/', (req, res) => {
//     res.send("Hello Ruturaj");
//  })
app.get('/api/myfriends', (req, res) => {
    const friends = [
        {
            id: 1,
            name: "Soham"
        },
        {
            id: 2,
            name: "Rohit",
        },
        {
            id: 3,
            name: "Kavya"
        },
        {
            id: 4,
            name: "Prachoo"
        },
        {
            id: 5, 
            name: "Sahil"
        },
        {
            id: 6,
            name: "Sohil Bhai"
        },
        {
            id: 7,
            name: "Noopure"
        }
    ];
    res.send(friends);
})

app.listen(process.env.PORT, () => {
    console.log("listening on port " + process.env.PORT);
})