#!/usr/bin/env node

var fs = require('fs');
var exec = require('child_process').exec;
var program = require('commander');
var yaml = require('js-yaml');
var Promise = require('bluebird');
var async = require('async');
var _ = require('lodash');

var getConfig = function(){
  try {
    return yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8'));
  }
  catch (e){
    if(e instanceof YAMLException){
      console.error(e);
      exit();
    }
  }
};

var exit = function(){
  process.exit();
};

var fileInfo = function(path, cb){
  return fs.stat(path, function(err, stats){
    cb(err, {
      path: path,
      isFile: stats.isFile()
    });
  });
};

var parsePaths = function(paths){
  var map = Promise.promisify(async.map);
  return map(paths, fileInfo);
};

var getFiltersByRegex = function(path){
  return config.filters.filter(function(filter){
    return path.match(new RegExp(filter.match));
  });
};

var getApplicableFilter = function(file){
  var filter = getFiltersByRegex(file.path);
  if(filter.length > 0){
    return _.extend(file, {
      filter: _.first(filter)
    });
  }
};

var getApplicableFilters = function(files){
  return _.chain(files)
          .map(getApplicableFilter)
          .compact()
          .value();
};

var constructCommand = function(filter){
  var command = _.reduce(config.vars, function(m, v){
    return m.replace('%' + v.name + '%', v.value);
  }, filter.filter.command);
  return command.replace('%FILE_NAME%', filter.path);
};

var constructCommands = function(filters){
  return _.map(filters, constructCommand);
};

var runCommands = function(commands){
  var eachSeries = Promise.promisify(async.eachSeries);
  return eachSeries(commands, exec);
};

var config = getConfig().plow;

program
  .version('0.0.1')
  .parse(process.argv);

parsePaths(program.args).then(_.compose(
  console.log,
  runCommands,
  constructCommands,
  getApplicableFilters
));
