const express = require('express');
require('dotenv').config();
require('./db/mongoose');
const userRoutes = require('./routers/user');
const taskRoutes = require('./routers/task');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(userRoutes);
app.use(taskRoutes);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
