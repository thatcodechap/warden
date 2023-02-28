import express from 'express'
import cookieParser from 'cookie-parser';
import {fileURLToPath} from 'url';
import path from 'node:path';
import { sendData,authorize,sync} from './middlewares.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use('/styles',express.static('public/styles'));
app.use('/scripts',express.static('public/scripts'));
app.use(cookieParser());
app.use(express.json());

app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname,'public/index.html'));
})
app.get('/fetch', sendData);
app.post('/sync', sync);
app.get('/auth', authorize);

app.listen(8080,()=>{});