const fs = require('fs');
const path = require('path');

const v10Path = path.resolve(__dirname, '../demo/v10.html');
const v10Content = fs.readFileSync(v10Path, 'utf8');

const funcStart = v10Content.indexOf('function initGlobalBottleDefs');
console.log('funcStart:', funcStart);

const backtick1 = v10Content.indexOf('`', funcStart);
const backtick2 = v10Content.indexOf('`', backtick1 + 1);
console.log('backtick1:', backtick1, 'backtick2:', backtick2);

const defsString = v10Content.slice(backtick1 + 1, backtick2);
console.log('Defs length:', defsString.length);
console.log('Start snippet:', defsString.slice(0, 100));
console.log('End snippet:', defsString.slice(-100));

fs.writeFileSync(path.resolve(__dirname, '../scratch/clean_defs.xml'), defsString);
