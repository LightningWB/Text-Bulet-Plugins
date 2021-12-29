const bullet = require('./bullet');

const plug = bullet.makePlugin('arenaNotifs');

function globalBroadCast(message, blackScreen) {
	const players = bullet.players.onlinePlayers();
	for(const player of players) {
		player.raw(`(function(){const message = "${message}"; if(${player.public.state !== 'event' && player.public.state !== 'looting' && player.cache.activeBattleId === undefined}){ENGINE.stopPlayerServer(); POPUP.new("the boom", "a deep thunderous boom rolls over the planet from every direction, shaking the ground, rocking the world. after a few minutes the thunder fades and an announcement can be heard from above.<span class='doc'>" + message + "</span>")} else {ENGINE.log(message)}})();`)
	}
}

function globalScreen(messages) {
	const players = bullet.players.onlinePlayers();
	for(const player of players) {
		player.raw(`(function(){
			const messages = ${JSON.stringify(messages)};
			let index = -1;
			const nextBtn = document.getElementById("begin-nextBtn");
			function bigMsg(text) {
				YOU.bigBlock.style.display = "none";
        		YOU.bigBlock.style.transition = "1000ms opacity";
        		YOU.bigBlock.style.opacity = "0";

				YOU.bigText.style.opacity = "0";
				YOU.bigText.style.transition = "1000ms opacity";
				YOU.bigText.innerHTML = text;
				YOU.bigBtn.style.transition = "1000ms opacity";
				YOU.bigBtn.style.opacity = "0";
				
				YOU.bigBtn.style.display = "";

				YOU.bigBlock.style.display = "";
				setTimeout(function () {
					YOU.bigBlock.style.opacity = "1";
					YOU.bigText.style.opacity = "1";
				}, 1);
				setTimeout(function () {
					YOU.bigBtn.style.opacity = "1";
				}, 3000);
			}
			function cb() {
				index++;
				if(index < messages.length) {
					bigMsg(messages[index]);
					if(index !== messages.length - 1) {
						YOU.bigBtn.onclick = () => {
							YOU.bigText.style.opacity = "0";
							YOU.bigBtn.style.opacity = "0";
							setTimeout(cb, 1000);
						};
					} else {
						YOU.bigBtn.setAttribute("onclick", "YOU.bigBlock.style.opacity='0';setTimeout(function(){YOU.bigBlock.style.display='none';},1000);");
						setTimeout(function () {
							YOU.bigBtn.setAttribute("onclick", "YOU.bigBlock.style.opacity='0';setTimeout(function(){YOU.bigBlock.style.display='none';},100);");
						}, 1010);
					}
				}
			}
			cb();
		})();`);
	}
}

plug.on('travelers::killPlayer', player => {
	// give time for battle to clean up
	setTimeout(() => {
		const alivePlayers = bullet.players.onlinePlayers().filter(p => p.public.state !== 'death' && p.public.username !== 'LightningWB');
		if(alivePlayers.length > 1) {
			if(player.public.state === 'int') {
				globalBroadCast(player.public.username + ' has been killed. ' + alivePlayers.length + ' travelers remain.')
			} else {
				globalBroadCast(player.public.username + ' has fallen. ' + alivePlayers.length + ' travelers remain.');
			}
		} else if(alivePlayers.length === 1) {
			globalScreen([
				`you, ${alivePlayers[0].public.username}, are now the official champion of eduro.`
			]);
		}
	}, 0);
}, 1000);