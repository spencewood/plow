var glob = require('glob');
var Promise = require('bluebird');
var _ = require('lodash');

module.exports = FileHandler;

function FileHandler(){
  this.filters = [];
}

FileHandler.prototype.addFilter = function(filter){
  if(!_.has(filter, 'name')){
    throw new Error('name must be defined for each filter');
  }
  if(!_.has(filter, 'match')){
    throw new Error('match must be defined for each filter');
  }
  if(!_.has(filter, 'command')){
    throw new Error('command must be defined for each filter');
  }
  this.filters.push(filter);
};

FileHandler.prototype.addFilters = function(filters){
  filters.forEach(this.addFilter.bind(this));
};

FileHandler.prototype.getFilesByFilter = function(path){
  return Promise.map(this.filters, function(filter){
      return new Promise(function(res, rej){
        glob(path + filter.match, {
          matchBase: true
        }, function(err, files){
          if(err){
            return rej(err);
          }
          return res(files.map(function(path){
            return {
              path: path,
              command: filter.command
            }
          }));
        });
      });
    })
    .then(_.flatten);
};
