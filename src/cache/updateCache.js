export default async function updateCache({ cache, resource, query }) {
    const isRefetching = await cache.get(`${resource}:refetching`);
    if (isRefetching) return;

    console.log(`[${resource.toUpperCase()}] - Obsolete Data: fetching...`);
    await cache.set(`${resource}:refetching`, 'true', { EX: 10 });
    const resourceFromDatabase = await query();
    await cache.set(resource, JSON.stringify(resourceFromDatabase));
    await cache.set(`${resource}:validation`, 'true', { EX: 5 });
    await cache.del(`${resource}:refetching`);
}