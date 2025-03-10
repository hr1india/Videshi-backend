import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authAgent from "./routes/authAgentRoutes.js"
import authRoutes from "./routes/authRoutes.js"


dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth/agent', authAgent)
app.use('/api/auth/', authRoutes)

const agentTaskRouter = require('./routes/task.route')
const agentDescriptionRouter = require('./routes/description.route')

app.use('/api/agent/tasks', agentTaskRouter)

app.use('/api/agent/description', agentDescriptionRouter)

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})