import knex from 'knex';

export const client = knex({
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DATABASE_URL || "./mydb.sqlite"
    }
});

export const setupDatabase = async () => {
    const hasTable = await client.schema.hasTable('heroes');
    if (!hasTable) {
        await client.schema.createTable('heroes', table => {
            table.increments('id').primary();
            table.string('name');
            table.integer('powerLevel');
        });
    }
}