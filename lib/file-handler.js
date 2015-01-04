var minimatch = require('minimatch');
var glob = require('glob');
var Promise = require('bluebird');
var stat = Promise.promisify(require('fs').stat);
var _ = require('lodash');

module.exports = FileHandler;

function FileHandler(){
  this.filters = [];
}

FileHandler.prototype.addFilter = function(filter){
  if(!_.has(filter, 'name')){
    throw new Error('name must be defined for each filter');
  }
  if(!_.has(filter, 'files')){
    throw new Error('files must be defined for each filter');
  }
  if(!_.has(filter, 'command')){
    throw new Error('command must be defined for each filter');
  }
  this.filters.push(filter);
};

FileHandler.prototype.addFilters = function(filters){
  filters.forEach(this.addFilter.bind(this));
};

FileHandler.prototype.getFilesByFilter = function(){
  var args = _.toArray(arguments);
  return Promise.map(this.filters, function(filter){
    return Promise.map(args, function(path){
      return stat(path).then(function(p){
        if(p.isDirectory()){
          return handleDirectory(path, filter);
        }
        else{
          return handleFile(path, filter);
        }
      });
    });
  }).then(_.flatten).then(_.compact);
};

function filterByPath(match){
  return function(path){
    if(match != null){
      var filterMatch = new RegExp(match);
      return path.match(filterMatch);
    }
    return true;
  }
}

function handleDirectory(path, filter){
  return new Promise(function(res, rej){
    glob(path + filter.files, function(err, files){
      if(err){
        return rej(err);
      }
      return res(files
        .filter(filterByPath(filter.match))
        .map(function(path){
          return {
            path: path,
            command: filter.command
          };
        })
      );
    });
  });
}

function handleFile(path, filter){
  return new Promise(function(res, rej){
    var filterMatch = filterByPath(filter.match);
    if(minimatch(path, filter.files, { matchBase: true }) && filterMatch(path)){
      return res({
        path: path,
        command: filter.command
      });
    }
    return res(null);
  });
}
