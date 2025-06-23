// keep if adding symbol choice scene?



// in onUpdate
			const symbolMatches = symbolMatch.getMatch(points, 64, 32);

			// only adds if the first one didn't get it
			const symbolMatches2 = symbolMatch2.getMatch(points, 64, 32);
			
			let matched = [...symbolMatches];
			const used = [...symbolMatches];
			
			symbolMatches2.forEach(s => {
				if (!matched.includes(s)) {
					matched.push(s);
				} else if (!used.includes(s)) {
					matched.push(s);
				} else {
					used.splice(used.indexOf(s), 1);
				}
			});

			matched = matched.filter(s => finishString.includes(s));

			if (matched.length > prevMatched.length) {
				if (connection === Consts.WEB_CONNECTS.COMPLETED) {
					web.cancel();
				}
				sfx.play('match', true, 0.9, 1.1);
			}
			prevMatched = matched.sort().join('');

			if (prevMatched === finishString) {
				// spider got it
				sun.end();
			}