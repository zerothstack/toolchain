const {expect} = require('chai');
const {spawn}  = require('child_process');
const _ = require('lodash');

function runCommand(command, cb){

  const parts = command.split(' ');
  
  const cmd = spawn(parts.shift(), parts, {
        cwd: './test/output',
        stdio: [0, 1, 2]
      });

      cmd.on('close', (code) => {
        if (code !== 0) {
          throw new Error(`child process exited with code ${code}`);
        }

        cb();
      });

      cmd.on('error', (err) => {
        throw err;
      });
}

describe('Initialization', () => {

  before((done) => {
    runCommand('ubiquits init -y', done);
  });

  it('initializes the package.json with defaults', () => {

    const package = require('./output/package.json');

    expect(package.version).to.equal('0.0.0');
    expect(package.licence).to.equal('MIT');
    expect(package.description).to.equal('Test project');

  });
  
  it.skip('creates and commits a new repo', () => {
    //@todo
  });

});

describe.skip('Project build', () => {

});

describe.skip('Project test', () => {

});