function assignList(keys, list) {
	const obj = {};
	list = shuffle(list);
	let idx = 0;
	for (const k of keys) {
		obj[k] = list[idx];
		idx++;
	}
	return obj;
}

function getRange(min, max) {
	let a = randInt(min, max);
	let b = randInt(min, max);
	return a < b ? [a, b] : [b, a];
}

export { assignList, getRange };