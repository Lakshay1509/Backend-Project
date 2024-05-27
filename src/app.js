import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true,
}))

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true ,limit: "16kb"}));


app.use(express.static('public'));
app.use(cookieParser());



import userRouter from './routes/user.routes.js';

app.use('/api/v1/users', userRouter);

import videoRouter from './routes/video.routes.js';

app.use('/api/v1/videos', videoRouter);




export default app;