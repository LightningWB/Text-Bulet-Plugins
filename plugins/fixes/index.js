const bullet = require('./bullet');

const plug = bullet.makePlugin('tt+ fixed');
let CURRENT_TURN = 0;

plug.on('gameTick', () => {
	if(CURRENT_TURN % 100 === 0) {
		const players = bullet.players.getPlayerNames().map(name => bullet.players.getPlayerByUsername(name));
		const edgeTexture = bullet.worldGen.getTileTexture('worldedge');
		for(const player of players) {
			const x = player.public.x;
			const y = player.public.y;
			if(bullet.generateTileAt(x, y) === edgeTexture) {
				player.public.skills.hp--;
				if(bullet.players.isPlayerOnline(player.public.username)) {
					player.addPropToQueue('skills');
				}
			}
		}
	}
	CURRENT_TURN++;
}, -100);

// stop building within 25 of 0,0
plug.on('travelers::canPlaceStructure', (data, player, out) => {
	const { x, y} = data;
	if(Math.abs(x) < 25 && Math.abs(y) < 25) {
		out.set(false);
		return false;
	}
});

plug.on('travelers::shouldHealPlayer', (player, out) => {
	if(CURRENT_TURN % Math.ceil(bullet.options.tps * 5) === 0) {
		out.set(true);
		return false;
	} else {
		out.set(false);
		return false;
	}
});

bullet.patches.addJs('TIME.tps=' + Math.ceil(bullet.options.tps));
bullet.patches.addJs('TIME.rawTPS=' + bullet.options.tps);
// when the tps is greater than 2 the timer sucks
if(bullet.options.tps < 1) {
	bullet.patches.addJs(`TIME.period = 25;TIME.countdown = function () {
        let setTimes = function (t) {
            TIME.countdownEl.innerHTML = t;
            POPUP.evCycleText.innerHTML = "cycle: " + t;
        };

        TIME.setDate();
        TIME.hundms = 0;

        clearInterval(TIME.countdown_interval);
        clearInterval(TIME.dc_timeout);
		let c = TIME.period - TIME.hundms;
        c = new Array(c).fill("█").join("");
        setTimes(c);

        TIME.countdown_interval = setInterval(function () {
            TIME.hundms++;
            if (TIME.hundms === TIME.period) {
                setTimes(new Array(TIME.period).fill("▒").join(""));
                clearInterval(TIME.countdown_interval);
                if (!YOU.isDead && !TIME.server_dc) {
                    TIME.dc_timeout = setTimeout(function () {
                        let switchbool = true;
                        TIME.countdown_interval = setInterval(function () {
                            if (switchbool) {
                                setTimes("disconnected.");
                            } else {
                                setTimes("<b>disconnected.</b>");
                            }
                            switchbool = !switchbool;
                        }, 1750);

                        setTimeout(function () {
                            document.getElementById("event-cycle").style.display = "none";
                        }, GAMEPROPS.framerate);
                        
                        NOTIF.new("disconnected");
                        DC.open();
                    }, 12000);
                }
            } else {
                let c = TIME.period - TIME.hundms;
                c = new Array(TIME.period).fill(0).map((_, i)=> i < TIME.period - TIME.hundms ? "█" : "▒").join("");

                setTimes(c);
            }
        }, 1 / TIME.rawTPS * 1000 / TIME.period);
    }`);
} else if(bullet.options.tps > 1) {
	bullet.patches.addJs(`TIME.countdown = function(){
		let setTimes = function (t) {
			TIME.countdownEl.innerHTML = t;
			POPUP.evCycleText.innerHTML = "cycle: " + t;
		};
		TIME.setDate();
		clearTimeout(TIME.dc_timeout);
		setTimes(TIME.turn);
		TIME.dc_timeout = setTimeout(function () {
			let switchbool = true;
			TIME.countdown_interval = setInterval(function () {
				if (switchbool) {
					setTimes("disconnected.");
				} else {
					setTimes("<b>disconnected.</b>");
				}
				switchbool = !switchbool;
			}, 1750);
			setTimeout(function () {
				document.getElementById("event-cycle").style.display = "none";
			}, GAMEPROPS.framerate);
			
			NOTIF.new("disconnected");
			DC.open();
		}, 12000);
	}`);
}
bullet.patches.addPatch('PVP.engine_process', '10', '10 * TIME.tps', false);
bullet.patches.addPatch('PVP.start', 'PVP.timerBS_int = 60;', 'PVP.timerBS_int = 60 * TIME.tps;PVP.chalTimerEl.innerText = PVP.timerBs_int;');
bullet.patches.addPatch('PVP.start', 'PVP.chalTimerEl.innerHTML = "60";', '');
bullet.patches.addPatch('PVP.showRoundReview', '4', '5 * TIME.tps - 1', false);

bullet.patches.addPatch('WORLD.checkPlayersAndObjs', 'WORLD.TILES.grass', 'WORLD.TILES.stump || WORLD.TILES.grass', false);
bullet.patches.addPatch('WORLD.checkPlayersAndObjs', ', WORLD.TILES.grass', ', WORLD.TILES.stump || WORLD.TILES.grass', false);

plug.addAdminText('setTime', 'Time', 'Set Time', d => {
	if(Number.isInteger(Number(d))) {
		bullet.emit('travelers', 'setTime', util.out(Number(d), 'int'));
		return 'Time set to ' + d;
	} else {
		return 'Invalid time';
	}
});

bullet.patches.addPatch('MSG.close', '{', '{if(YOU.state === "event"){POPUP.evBox.style.display = "";POPUP.evBlock.style.display = "";}', false);
bullet.patches.addPatch('MSG.open', '{', '{if(YOU.state === "event"){POPUP.evBox.style.display = "none";POPUP.evBlock.style.display = "none";clearInterval(EVENTS.leaveEventCountdown);}', false);
bullet.patches.addPatch('ENGINE.log', 'MOBILE.notif("event");', 'MOBILE.notif("event");const pp=ENGINE.console;for(const p of pp.children){const children=p.children;for(const c of children)if(c.tagName==="INPUT")p.removeChild(c);}');

// if you have a bp and the recipe unlocked
bullet.patches.addPatch('CRAFTING.setHtml', 'let miscText = []', 'const added = [];let miscText = []', false);
bullet.patches.addPatch('CRAFTING.setHtml', 'switch (type) {', 'if(added.includes(job.name)){return;}added.push(job.name);switch (type) {', false);

// other players stand over tile
bullet.patches.addPatch('WORLD.checkPlayersAndObjs', '(YOU.x !== x || YOU.y !== y)', '(YOU.x !== x || YOU.y !== y) || WORLD.otherPlayers.find(p => p.x === x && p.y === y) !== undefined', false);