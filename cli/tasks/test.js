module.exports = (vorpal, config) => {

  vorpal.command('test', 'Outputs test text')
    .action(function (args, callback) {
      this.log('This is a custom command example [test]');
      callback();
    });

};