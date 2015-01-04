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
    console.error(e);
    process.exit();
  }
};

var execute = function(command){
  return new Promise(function(res, rej){
    exec(command, function(err, stdout){
      if(err){
        rej(err);
      }
      else{
        res(stdout);
      }
    });
  });
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
  .version('0.0.1')
  .option('-c, --config <path>', 'Set config path. Defaults to ~/.plow', process.env.HOME + '/.plow')
  .parse(process.argv);

var config = getConfig(program.config).plow;

var handle = new Handler();
handle.addFilters(config.filters);

var run = new Runner();
run.addTokens(config.tokens);
run.addCommands(config.commands);

handle.getFilesByFilter(program.args)
  .then(run.parseFileCommands.bind(run))
  .then(runCommands)
  .catch(function(err){
    console.error('error', err);
  });
