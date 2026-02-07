import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db.js';
import 'colors';
import routes from '#routes/routes.js';
import { errorHandler } from '#middlewares/errorMiddleware.js';

dotenv.config();
connectDB();

const port = process.env.PORT || 3000;
const app = express();

app.use(cors("*"));
app.use(express.json());


app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api', routes);


app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}.`.green));