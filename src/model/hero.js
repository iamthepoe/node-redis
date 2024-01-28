export function validateHero(hero) {
    if (!hero.name) {
        return { error: 'Hero must have a name', ok: false };
    }
    if (!hero.powerLevel) {
        return { error: 'Hero must have a power level', ok: false };
    }

    if (hero.powerLevel < 0) {
        return { error: 'Hero power level must be positive', ok: false };
    }

    if(typeof hero.name !== 'string'){  
        return { error: 'Hero name must be a string', ok: false };
    }

    if(typeof hero.powerLevel !== 'number'){  
        return { error: 'Hero power level must be a number', ok: false };
    }

    return { ok: true };
}