var should = require('chai').should();
var Promise = require('bluebird');
var FileHandler = require('../lib/file-handler');

describe('File handler', function(){
  beforeEach(function(){
    this.fh = new FileHandler();
  });

  it('should exist', function(){
    should.exist(this.fh);
  });

  describe('#addFilter()', function(){
    it('should add a single filter', function(){
      this.fh.addFilter({
        name: 'test',
        match: 'test*',
        command: 'test'
      });
      this.fh.filters.should.eql([{
        name: 'test',
        match: 'test*',
        command: 'test'
      }]);
    });

    it('should throw an exception for filters without a name', function(){
      (function(){
        this.fh.addFilter({
          match: 'test*',
          command: 'test'
        });
      }.bind(this)).should.throw(Error, /must be defined/);
    });

    it('should throw an exception for filters without a match', function(){
      (function(){
        this.fh.addFilter({
          name: 'test',
          command: 'test'
        });
      }.bind(this)).should.throw(Error, /must be defined/);
    });

    it('should throw an exception for filters without a command', function(){
      (function(){
        this.fh.addFilter({
          name: 'test',
          match: 'test*'
        });
      }.bind(this)).should.throw(Error, /must be defined/);
    });
  });

  describe('#addFilters()', function(){
    it('should add multiple filters', function(){
      this.fh.addFilters([{
        name: 'test1',
        match: 'test1*',
        command: 'test'
      },{
        name: 'test2',
        match: 'test2*',
        command: 'test'
      }]);
      this.fh.filters.should.have.length(2);
    });
  });

  describe('#getFilesByFilter()', function(){
    it('should return a promise', function(){
      this.fh.addFilter({
        name: 'txt',
        match: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter().should.be.instanceOf(Promise);
    });

    it('should return an empty array if zero files found', function(done){
      this.fh.addFilter({
        name: 'empty',
        match: '*.empty',
        command: 'cat'
      });
      this.fh.getFilesByFilter().then(function(files){
        files.should.be.an.Array;
        files.should.have.length(0);
      }).then(done);
    });

    it('should return an array of paths with filter commands for each', function(done){
      this.fh.addFilter({
        name: 'txt',
        match: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area1/').then(function(files){
        files[0].should.have.property('path');
        files[0].should.have.property('command');
      }).then(done);
    });

    it('should prepend the passed in path', function(done){
      this.fh.addFilter({
        name: 'txt',
        match: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area2/').then(function(files){
        files[0].path.should.match(/^\.\/test/);
      }).then(done);
    });

    it('should not be recursive without a globstar', function(done){
      this.fh.addFilter({
        name: 'txt',
        match: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/').then(function(files){
        files.should.have.length(0);
      }).then(done);
    });

    it('should be recursive with a globstar', function(done){
      this.fh.addFilter({
        name: 'txt',
        match: '**/*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/').then(function(files){
        files.should.have.length(4);
      }).then(done);
    });

    it('should return three text files from area1', function(done){
      this.fh.addFilter({
        name: 'txt',
        match: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area1/').then(function(files){
        files.should.have.length(3);
      }).then(done);
    });

    it('should return one log file from area2', function(done){
      this.fh.addFilter({
        name: 'log',
        match: '*.log',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area2/').then(function(files){
        files.should.have.length(1);
      }).then(done);
    });

    it('should run multiple filters and return all results in the same array', function(done){
      this.fh.addFilters([{
        name: 'txt',
        match: '**/*.txt',
        command: 'cat'
      },{
        name: 'log',
        match: '**/*.log',
        command: 'cat'
      }]);
      this.fh.getFilesByFilter('./test/sandbox/').then(function(files){
        files.should.have.length(5);
      }).then(done);
    });
  });
});
