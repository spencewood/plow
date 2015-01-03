#!/usr/bin/env node

var fs = require('fs');
var exec = require('child_process').exec;
var program = require('commander');
var yaml = require('js-yaml');
var Promise = require('bluebird');
var ProgressBar = require('progress');
var recursive = require('recursive-readdir');
var _ = require('lodash');

var getConfig = function(){
  try {
    return yaml.safeLoad(fs.readFileSync(process.env.HOME + '/.plow', 'utf8'));
  }
  catch (e){
    console.error(e);
    exit();
  }
};

var exit = function(){
  process.exit();
};

var fileInfo = function(path, cb){
  return new Promise(function(res, rej){
    fs.stat(path, function(err, stats){
      if(err){
        return rej(err);
      }
      return res({
        path: path,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      });
    });
  });
};

var parsePaths = function(paths){
  return Promise.map(paths, fileInfo);
};

var parsePathsRecursive = function(paths){
  var pluck = function(prop){
    return function(arr){
      return _.pluck(arr, prop);
    };
  };

  return parsePaths(paths).then(function(files){
      return files.filter(function(path){
        return path.isDirectory;
      });
    })
    .then(pluck('path'))
    .map(function(dir){
      return new Promise(function(res, rej){
        recursive(dir, function(err, files){
          if(err){
            return rej(err);
          }
          return res(files);
        });
      });
    })
    .then(_.flatten)
    .then(_.compact)
    .map(fileInfo);
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
  return _.reduce(files, function(memo, file){
    var filter = getApplicableFilter(file);
    if(filter != null){
      memo.push(filter);
    }
    return memo;
  }, []);
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
    '[:bar] :current/:total',
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

var config = getConfig().plow;

program
  .version('0.0.1')
  .parse(process.argv);

parsePathsRecursive(program.args)
  .then(getApplicableFilters)
  .then(constructCommands)
  .then(runCommands)
  .catch(function(err){
    console.error('error', err);
  })
  .then(function(){
    exit();
  });
