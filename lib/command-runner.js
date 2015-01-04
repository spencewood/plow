var Promise = require('bluebird');
var _ = require('lodash');

module.exports = CommandRunner;

function CommandRunner(){
  this.tokens = [];
  this.commands = [];
};

CommandRunner.prototype.addToken = function(token){
  if(!_.has(token, 'name')){
    throw new Error('name must be defined for each token');
  }
  if(!_.has(token, 'value')){
    throw new Error('value must be defined for each token');
  }
  this.tokens.push(token);
};

CommandRunner.prototype.addTokens = function(tokens){
  tokens.forEach(this.addToken.bind(this));
};

CommandRunner.prototype.addCommand = function(command){
  if(!_.has(command, 'name')){
    throw new Error('name must be defined for each command');
  }
  if(!_.has(command, 'run')){
    throw new Error('run must be defined for each command');
  }
  this.commands.push(command);
};

CommandRunner.prototype.addCommands = function(commands){
  commands.forEach(this.addCommand.bind(this));
};

CommandRunner.prototype.parseCommand = function(command, path){
  var cmd = _.find(this.commands, {
    name: command
  });
  if(cmd == null){
    throw new Error('command not found');
  }
  return replaceTokens(cmd.run, path, this.tokens);
};

CommandRunner.prototype.parseFileCommands = function(files){
  return Promise.map(files, function(file){
    return this.parseCommand(file.command, file.path);
  }.bind(this));
};

function replaceTokens(command, path, tokens){
  var command = _.reduce(tokens, function(m, v){
    return m.replace('%' + v.name + '%', v.value);
  }, command);
  return command.replace('%FILE_NAME%', path);
}
