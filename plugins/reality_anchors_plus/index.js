const bullet = require('./bullet');

const plug = bullet.makePlugin('reality_anchors_plus');
const spiral = require('./spiral');

/**
 * @param {bullet.players.player} player 
 */
async function checkAnchors(player) {
    for(const anchor of player.private.anchors) {
        (async () => {
            const chunkCoords = bullet.chunks.toChunkCoords(anchor.x, anchor.y);
            await bullet.chunks.loadChunk(chunkCoords.x, chunkCoords.y);
            if(bullet.chunks.getObject(anchor.x, anchor.y)?.private?.structureId !== 'reality_anchor') {
                player.private.anchors = player.private.anchors.filter(e => e.x !== anchor.x && e.y !== anchor.y);
            }
        })();
    }
}

plug.on('travelers::addStructureData', data => {
    if(data.id === 'reality_anchor') {
        data.walkOver = true;
        data.eventId = 'structure_reality_anchor';
        data.eventType = 'structure_reality_anchor';
    }
}, 100);

plug.on('travelers::structurePlaced::reality_anchor', (obj, player) => {
    obj.private.players = [player.id];
    if(player.private.anchors === undefined)player.private.anchors = [];
    player.private.anchors.push({x: obj.public.x, y: obj.public.y});
}, 0);

plug.on('travelers::structureBroke::reality_anchor', (obj) => {
    for(const id of obj.private.players) {
        const player = bullet.players.getPlayer(id);
        player.private.anchors = player.private.anchors.filter(e => e.x !== obj.public.x && e.y !== obj.public.y)
    }
    return false;
}, 10);

plug.on('travelers::calcPlayerEvent', player => {
    if(player.private.eventData?.type === 'structure_reality_anchor' && player.public.state === 'event' && player.private.eventData?.room === 'main') {
        const priv = bullet.chunks.getObject(player.public.x, player.public.y)?.private;
        const players = priv?.players
        if(Array.isArray(players)) {
            player.temp.event_data.stage_data.desc = player.temp.event_data.stage_data.desc.replace('[ANCHORED_PLAYERS]', players.map(bullet.players.getPlayer).map(p => p.public.username).join('<br>'));
        } else if(typeof priv?.owner === 'number') {
            priv.players = [priv.owner];
            player.temp.event_data.stage_data.desc = player.temp.event_data.stage_data.desc.replace('[ANCHORED_PLAYERS]', priv.players.map(bullet.players.getPlayer).map(p => p.public.username).join('<br>'));
        }
    } else if(player.private.eventData?.type === 'structure_reality_anchor' && player.public.state === 'event') {
        const priv = bullet.chunks.getObject(player.public.x, player.public.y)?.private;
        player.temp.event_data.stage_data.desc = player.temp.event_data.stage_data.desc.replace('[LOCATIONS]', player.private.anchors.map(a => `<input type=\"button\" onclick=\"SOCKET.send({action:'fast_travel', x:${a.x}, y:${a.y}});this.onclick='';this.value='loading...';\" value=\"(${a.x}, ${a.y})\">`).join('<br>'));
    }
}, -100);

plug.on('actions::anchor_self', (packet, player) => {
    if(player.public.state === 'event') {
        const obj = bullet.chunks.getObject(player.public.x, player.public.y);
        if(obj?.private?.structureId === 'reality_anchor') {
            if(!obj.private.players.includes(player.id)) {
                obj.private.players.push(player.id);
                player.private.anchors.push({x: obj.public.x, y: obj.public.y});
                bullet.emit('travelers', 'calcPlayerEvent', player);
            }
        } else return false;
    } else return false;
}, 0);

plug.on('actions::fast_travel', (packet, player) => {
    const anchor = player.private.anchors.find(a => packet.x === a.x && packet.y === packet.y);
    if(anchor) {
        let hasItem = false;
	    for(const id in player.private.supplies) {
	    	if(player.private.supplies[id] > 0) {
	    		hasItem = true;
	    		break;
	    	}
	    }
	    if(hasItem) {
	    	spiral.loopOut(player.public.x, player.public.y, async loc => {
	    		const {x, y} = loc;
                const cc = bullet.chunks.toChunkCoords(x, y);
                await bullet.chunks.waitForChunkCoordsToBeLoaded(cc.x, cc.y);
	    		if(!bullet.chunks.isObjectHere(x, y)) {
	    			const tile = bullet.generateTileAt(x, y);
	    			if(tile !== 'w' && tile !== '░' && tile !== 'H' && tile !== 'C') {
	    				bullet.emit('travelers', 'addEventTile',
	    					x,
	    					y,
	    					'n',
	    					'dropped_items',
	    					'dropped_items'
	    				);
	    				const eventObj = bullet.chunks.getObject(x, y);
	    				bullet.emit('travelers', 'craft_cancelall', null, player, false);
	    				eventObj.private.eventData.loot = {main: util.clone(player.private.supplies)};
	    				player.private.supplies = {};
                        bullet.emit('travelers', 'renderItems', player, true);
                        bullet.emit('travelers', 'calcWeight', player);
	    				return true;
	    			}
	    		}
	    	}).then(() => {
                player.public.x = anchor.x;
                player.public.y = anchor.y;
                player.public.state = 'travel';
                delete player.private.eventData;
                player.addPropToQueue('x', 'y', 'state');
                bullet.emit('travelers', 'addExeJs', player, 'YOU.bigMsg(\'equipment and bodies are impermanent; ideas and mind are everlasting.\')');
            });
	    } else {
            player.public.x = anchor.x;
            player.public.y = anchor.y;
            player.public.state = 'travel';
            delete player.private.eventData;
            player.addPropToQueue('x', 'y', 'state');
            bullet.emit('travelers', 'addExeJs', player, 'YOU.bigMsg(\'equipment and bodies are impermanent; ideas and mind are everlasting.\')');
        }
    }
}, 0)

plug.on('actions::genmsg', (packet, player) => {
    if(packet.option === 'removePlayerFromAnchor' && player.private.eventData?.type === 'structure_reality_anchor' && player.public.state === 'event') {
        const obj = bullet.chunks.getObject(player.public.x, player.public.y);
        if(obj?.private?.structureId === 'reality_anchor') {
            const pl = bullet.players.getPlayerByUsername(packet.text);
            if(pl) {
                const id = pl.id;
                if(obj.private.players.includes(id)) {
                    obj.private.players = obj.private.players.filter(e => e !== id);
                }
                pl.private.anchors = pl.private.anchors.filter(e => e.x !== obj.public.x && e.y !== obj.public.y);
            }
            bullet.emit('travelers', 'calcPlayerEvent', player);
        }
    }
}, 1000);

// send death coords
plug.on('playerTick', player => {
    if(player.public.state === 'death') {
        player.temp.anchors = player.private.anchors;
        player.addPropToQueue('anchors');
    }
});

plug.on('playerConnect', player => {
    if(player.public.state === 'death') {
        player.temp.anchors = player.private.anchors;
        player.addPropToQueue('anchors');
    }
});

plug.on('actions::reincarnate', (packet, player) => {
    console.log(packet, player)
    if(typeof packet.x === 'number' && typeof packet.y === 'number' && player.private.anchors.find(a => a.x === packet.x && a.y === packet.y) !== undefined) {
        player.public.x = packet.x;
        player.public.y = packet.y;
    }
}, -100);

bullet.patches.addListener('anchors', a => YOU.anchors = a);

bullet.patches.addPatch('YOU.kill', 'YOU.getDeathMsg();', 'YOU.anchors?.length > 0 ? YOU.anchors.map(a => `<input type="button" id="death-reincarnate-btn" value="reincarnate (${a.x}, ${a.y})" onclick="YOU.reincarnate(${a.x}, ${a.y}, this)">`).join(\'<br>\') : YOU.getDeathMsg();', false)
bullet.patches.addPatch('YOU.reincarnate', '()', '(x, y, ele)', false);
bullet.patches.addPatch('YOU.reincarnate', '"reincarnate"', '"reincarnate", x, y', false);
bullet.patches.addPatch('YOU.reincarnate', 'YOU.deathBtn', 'ele', false);
bullet.patches.addJs('YOU.deathBtn.value = "reincarnate (random)"; YOU.deathBtn.onclick = "YOU.reincarnate(undefined, undefined, this);"')

plug.on('ready', () => {
    bullet.emit('travelers', 'addEvent', 'structure_reality_anchor', require('./structure_reality_anchor.json'));
    bullet.util.debug('INFO', '[reality_anchors_plus] Beginning reality anchor checking asynchronously');
    for(const player of bullet.players.getPlayerNames().map(bullet.players.getPlayerByUsername)) {
        if(player.private.anchors === undefined)player.private.anchors = [];
        checkAnchors(player);
    }
    bullet.util.debug('INFO', '[reality_anchors_plus] Finished reality anchor checking');
});