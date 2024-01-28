import express from 'express'
import redis from 'redis';
import { setupDatabase, client } from './database/client.js';
import { validateHero } from './model/hero.js';

const app = new express();
const cache = redis.createClient();

app.use(express.json());

app.get('/heroes', async (_, res) => {
    const cachedHeroes = await cache.get('heroes');

    if(cachedHeroes){
        return res.send(JSON.parse(cachedHeroes));
    }

    const heroes = await client('heroes').select();

    cache.set('heroes', JSON.stringify(heroes), {EX: 10});
    res.send(heroes);
});

app.post('/heroes', async (req, res) => {
    const { name, powerLevel } = req.body;
    const validation = validateHero({ name, powerLevel });
    
    if(!validation.ok){
        return res.status(400).json(validation);
    }

    const heroId = (await client('heroes').insert({ name, powerLevel }, 'id'))[0].id;
    res.send({ id: heroId });
});

const initServer = async () =>{
    await setupDatabase();
    await cache.connect();

    app.listen(3000, ()=>{
        console.log('Server is running at http://localhost:3000');
    });   
}


initServer();