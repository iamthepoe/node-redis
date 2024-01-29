export default async function createTotalPowerReport({ client }){
    const powerLevels = await client('heroes').select('powerLevel');
    return {
        totalPower: powerLevels.reduce((total, { powerLevel }) => total + powerLevel, 0)
    };
}