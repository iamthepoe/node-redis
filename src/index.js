import express from 'express'
import redis from 'redis';
import { setupDatabase, client } from './database/client.js';
import { validateHero } from './model/hero.js';
import updateCache from './cache/updateCache.js';
import createTotalPowerReport from './reports/totalPower.js';

const app = new express();
const cache = redis.createClient();

app.use(express.json());


app.get('/heroes', async (_, res) => {
    const cachedHeroes = await cache.get('heroes');
    const isHeroesFromCacheStale = !(await cache.get('heroes:validation'));

    if(isHeroesFromCacheStale){
        updateCache({
            cache, 
            resource: 'heroes', 
            query: async () => await client('heroes').select()
        });
    }

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
    const isReportsFromCacheStale = !(await cache.get('reports:validation'));
    const cachedReport = await cache.get('reports');

    if(isReportsFromCacheStale){
        updateCache({
            cache, 
            resource: 'reports', 
            query: async () => await createTotalPowerReport({ client }),
        });
    }

    if(cachedReport) {
        return res.json(JSON.parse(cachedReport));
    }
    
    setTimeout(async ()=>{
        console.log('Generatting report...');
        const totalPower = await createTotalPowerReport({ client });
        res.json({ totalPower });
    }, 3000);
});

app.use(function (_, res) {
    res.status(404).send({ error: 'Not found' });
});

const initServer = async () =>{
    await setupDatabase();
    await cache.connect();

    app.listen(process.env.PORT || 3000, ()=>{
        console.log('Server is running at http://localhost:' + process.env.PORT || 3000);
    });   
}


initServer();