module.exports = function (message) {

  const columns = process.stdout.columns;

  const logo = `
                0
           00    00000
        0000      00  0000
    00000        0000    00000
 0000           000000       0000
000              0   000       000
000     00            000      000
000  000000             00     000
000   000     Zeroth     000   000
000     00             000000  000
000      000            00     000
000       000   0              000
 0000       000000           0000
    00000    000         00000
        0000  000     0000
            00000    00
                 0`;

  const maxWidth = logo.split('\n')
    .reduce((max, row) => max < row.length ? row.length : max, 0);

  if (maxWidth > columns) {
    return message;
  }

  const padding = Math.floor((columns - maxWidth) / 2);

  const emptyHexagon = '\u2b21';
  const filledHexagon = '\u2b22';

  const centredLogo = logo
    .replace(/0/g, m => Math.random() > 0.9 ? filledHexagon : emptyHexagon)
    .split('\n')
    .map(row => ' '.repeat(padding) + row)
    .join('\n');

  return centredLogo + `

${message}`;

};