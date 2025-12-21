import express from 'express';
import cors from 'cors';
import { 
  userRouter, 
  gymRouter, 
  badgeRouter, 
  exerciseTypeRouter, 
  challengeRouter,      
  trainingStatRouter, 
  socialRouter, 
  scoreRouter,
  badgeRuleRouter,
  rewardRouter
} from './src/routes';
import { connectMongoose } from "./src/db/mangoose";
import "dotenv/config";

const app = express();

app.use(cors()); 

app.use(express.json());

connectMongoose().catch(err => {
  console.error("Mongo connection failed", err);
  process.exit(1);
});

app.get('/', (req, res) => {
    res.send('TSPark API - Fitness Challenge Platform');
});

app.use('/user', userRouter);
app.use('/gym', gymRouter);
app.use('/badge', badgeRouter);
app.use('/exerciseType', exerciseTypeRouter);
app.use('/challenge', challengeRouter);
app.use('/trainingStat', trainingStatRouter);
app.use('/social', socialRouter);
app.use('/score', scoreRouter);
app.use('/badgeRule', badgeRuleRouter);
app.use('/reward', rewardRouter);

const port = process.env.NODE_PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});