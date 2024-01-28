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

app.get('/heroes/:id', async (req, res) => {
    const { id } = req.params;
    const hero = await client('heroes').where({ id }).first();
    if(!hero){
        return res.status(404).send({ error: 'Hero not found' });
    }
    res.send(hero);
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

app.delete('/heroes/:id', async (req, res) => {
    const { id } = req.params;
    await client('heroes').where({ id }).delete();
    return res.send({ ok: true });
});

app.get('/power-levels/report', async (_, res) => {
    const powerLevels = await client('heroes').select('powerLevel');

    const totalPower = powerLevels.reduce((total, { powerLevel }) => total + powerLevel, 0);

    res.send({ totalPower });
});

const initServer = async () =>{
    await setupDatabase();
    await cache.connect();

    app.listen(3000, ()=>{
        console.log('Server is running at http://localhost:3000');
    });   
}


initServer();