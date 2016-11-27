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
                 0`.replace(/0/g, '\u2b21');

  const maxWidth = logo.split('\n')
    .reduce((max, row) => {
      if (max < row.length) {
        max = row.length;
      }
      return max;
    }, 0);

  if (maxWidth > columns) {
    return message;
  }

  const padding = Math.floor((columns - maxWidth) / 2);

  const centredLogo = logo.split('\n')
    .map((row) => {
      row = ' '.repeat(padding) + row;
      return row;
    })
    .join('\n');

  return centredLogo + `

${message}`;

};