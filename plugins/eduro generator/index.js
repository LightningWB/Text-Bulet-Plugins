const bullet = require('./bullet');

const plug = bullet.makePlugin('eduro generator');

const config = plug.loadConfig({
	header: 'eduro generator\nby LightningWB',
	options: {
		edgeDistance: {
			allowed: 'Integer',
			default: 2500,
			description: 'The distance between edges of the map.'
		},
		edgeShrinkTime: {
			allowed: 'Integer',
			default: 2,
			description: 'How many seconds between edge shrinking. Set to -1 to disable.'
		},
		seed: {
			allowed: 'Number',
			default: 20171007,
			description: 'The world seed.'
		}
	}
});

const newWorldGen = `function generateTileAt(x,y){
	let bottomtile = TILES.sand;
	let biome = 'wasteland';
	const temperature = (8.35 * getPerlin(x - 2000, y, 3100) + 1.5 *getPerlin(x, y, 1200) + .15 * getPerlin(x, y, 80) )/ 10;
    const humidity = getPerlin(x, y);
    const height = (1.98 * getPerlin(x, y, 95) + .02 * getPerlin(x, y, 2)) / 2;
	const bigPerl = .89 * getPerlin(x, y, 583) + .07 * humidity + .06 * height;
    const randomNearOne = (getPerlin(x, y, 32) + 2 ) / 78;
    const grassPerlin = getPerlin(x, y, 32);
	const megaHeight = .998 * getPerlin(x, y, 2823) + .02 * grassPerlin;
    const climate = (1.8 * getPerlin(x, y, 1342) + .2 * getPerlin(x, y, 231)) / 2;
	let perlRand;
	const isHouse = () => {const floored = Math.floor(perlRand * 3400); return floored == 421 || floored == 832;};
	const isCity = () => {const floored = Math.floor(perlRand * 9000); return floored == 4203 || floored == -3025 || floored == -623;};
    if(temperature > .55) {
        // desert
        if(height > .55) {
            biome = 'mountains';
            bottomtile = TILES.mountain;// mountains are the same in a desert
        } else {
			biome = 'desert';
			perlRand = getPerlin(x, y, 2.501);
			const floored = Math.floor(perlRand * 3400);
			if(floored == 421) {
				bottomtile = TILES.house;
			} else if(getPerlin(x, y, 7) > .9) {
        	    bottomtile = TILES.tree;
        	} else {
        	    bottomtile = TILES.sand;// sand
        	}
		}	
    } else if(temperature > .4 + randomNearOne) {
        // hills
		if (megaHeight > .65) {
			biome = 'mountains';
			if(bigPerl < -.4 && megaHeight > .75) {
				bottomtile = TILES.grass;
			} else {
				bottomtile = TILES.mountain;
			}
		} else if(height < .55) {
			perlRand = getPerlin(x, y, 2.501);
			if(isCity()) {
				bottomtile = TILES.city;
			} else if(isHouse()) {
				bottomtile = TILES.house;
			} else if(getPerlin(x, y, 10) > .9) {
                bottomtile = TILES.tree;
            } else if(grassPerlin > .5) {
                bottomtile = TILES.grass;
            }
			biome = 'hills';
        } else {
            bottomtile = TILES.mountain;// mountain
            biome = 'mountains';
        }
    } else if(temperature > -.19) {
        // temperate
        // which subbiome
        if(megaHeight < .55 && temperature > -.17 && temperature < .3 && climate > .55) {
            if(climate > .6 && temperature > -.15 && temperature < .29) {
                if(humidity > .93) {
                    biome = 'pond';
                    bottomtile = TILES.water;
                } else if(humidity > .6) {
					biome = 'forest clearing';
					perlRand = getPerlin(x, y, 2.501);
					if(isHouse()) {
						bottomtile = TILES.house;
					} else {
						bottomtile = TILES.grass;
					}
                } else {
                    biome = 'forest';
                    bottomtile = TILES.forest;
                }
            } else {
                biome = 'forest edge';
				bottomtile = TILES.grass;
            }
        } else if(megaHeight > .65 && temperature > -.17) {
			biome = 'mountains';
			if(bigPerl < -.5 && megaHeight > .75) {
				bottomtile = TILES.grass;
			} else {
				bottomtile = TILES.mountain;
			}
		} else {
            biome = 'grasslands';
			perlRand = getPerlin(x, y, 2.501);
			if(isCity()) {
				bottomtile = TILES.city;
			} else if(isHouse()) {
				bottomtile = TILES.house;
			} else if((1.7 * grassPerlin + .3 * humidity) / 2 > -.4) {
                if(getPerlin(x, y, 16) > .85) {
                    bottomtile = TILES.tree;
                } else {
                    bottomtile = TILES.grass;
                }
            } else {
                bottomtile = TILES.sand;
            }
        }
    } else if(temperature > -.22) {
        biome = 'beach';
		perlRand = getPerlin(x, y, 2.501);
		if(isCity()) {
			bottomtile = TILES.city;
		}
    } else {
        if(temperature < -.4 && megaHeight > .5 && climate < -.2 + randomNearOne && (.8 * humidity + .2 * grassPerlin) /2 < -.2) {
            biome = 'island';
			perlRand = getPerlin(x, y, 2.501);
			if(isHouse()) {
				bottomtile = TILES.house;
			} else {
				bottomtile = TILES.island;
			}
        } else {
            // ocean
            biome = 'ocean';
            bottomtile = TILES.water;
        }
    }
	//edge
    if (EDGE_DIST - Math.abs(x) < 10) {
        if (EDGE_DIST - Math.abs(x) < 1) {
            bottomtile = TILES.worldedge;
        }
        else {
            let perlEdge = getPerlin(x, y, 0.005);
            if (1 / (EDGE_DIST - Math.abs(x) + perlEdge) > 0.16) {
                bottomtile = TILES.worldedge;
            }
        }
    }
    if (EDGE_DIST - Math.abs(y) < 10) {
        if (EDGE_DIST - Math.abs(y) < 1) {
            bottomtile = TILES.worldedge;
        }
        else {
            let perlEdge = getPerlin(x, y, 0.005);
            if (1 / (EDGE_DIST - Math.abs(y) + perlEdge) > 0.16) {
                bottomtile = TILES.worldedge;
            }
        }
    }
	if (x === YOU.x && y === YOU.y) {
        YOU.biome = biome;
    }
    if (isNode) {
        YOU._biome = biome;
    }
    return bottomtile;
};`;

const changeInterval = Math.ceil(bullet.options.tps * config.edgeShrinkTime);
let EDGE_DIST = config.edgeDistance;
plug.on('generator::getBorderDistance', out => out.set(EDGE_DIST));

bullet.worldGen.patchGenerator(bullet.worldGen.getGeneratorRaw(), newWorldGen.replace(/EDGE_DIST/g, EDGE_DIST));
bullet.worldGen.setSeed(config.seed);

if(config.edgeShrink >= 0) {
	let tick = 0;
	plug.on('gameTick', () => {
		if (tick % changeInterval === 0 && EDGE_DIST > 11) {
			EDGE_DIST -= 1;
			bullet.worldGen.patchGenerator(bullet.worldGen.getGeneratorRaw(), newWorldGen.replace(/EDGE_DIST/g, EDGE_DIST));
		}
		tick++;
	});
}