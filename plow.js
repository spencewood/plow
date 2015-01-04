#!/usr/bin/env node

var fs = require('fs');
var exec = require('child_process').exec;
var program = require('commander');
var yaml = require('js-yaml');
var Promise = require('bluebird');
var ProgressBar = require('progress');

var Handler = require('./lib/file-handler');
var Runner = require('./lib/command-runner');

var getConfig = function(configFile){
  try {
    return yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
  }
  catch (e){
    error(e);
  }
};

var error = function(err){
  console.error('error', err)
};

var execute = function(command){
  var ex = Promise.promisify(exec);
  return ex(command);
};

var runCommands = function(commands){
  var bar = new ProgressBar(
    '[:bar] :current/:total (:elapsed seconds)',
    {
      total: commands.length,
      width: 20
    }
  );

  var tick = function(){
    bar.tick();
  };

  return Promise.reduce(commands, function(_, command){
    return execute(command).then(tick);
  }, null);
};

program
  .version('0.1.0')
  .option('-c, --config <path>', 'Set config path. Defaults to ~/.plow', process.env.HOME + '/.plow')
  .parse(process.argv);

var config = getConfig(program.config).plow;

var handle = new Handler();
handle.addFilters(config.filters);

var run = new Runner();
run.addTokens(config.tokens);
run.addCommands(config.commands);

handle.getFilesByFilter.apply(handle, program.args)
  .then(run.parseFileCommands.bind(run))
  .then(runCommands)
  .catch(error);
