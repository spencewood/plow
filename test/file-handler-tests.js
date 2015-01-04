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
        files: 'test*',
        command: 'test'
      });
      this.fh.filters.should.eql([{
        name: 'test',
        files: 'test*',
        command: 'test'
      }]);
    });

    it('should throw an exception for filters without a name', function(){
      (function(){
        this.fh.addFilter({
          files: 'test*',
          command: 'test'
        });
      }.bind(this)).should.throw(Error, /must be defined/);
    });

    it('should throw an exception for filters without files', function(){
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
          files: 'test*'
        });
      }.bind(this)).should.throw(Error, /must be defined/);
    });
  });

  describe('#addFilters()', function(){
    it('should add multiple filters', function(){
      this.fh.addFilters([{
        name: 'test1',
        files: 'test1*',
        command: 'test'
      },{
        name: 'test2',
        files: 'test2*',
        command: 'test'
      }]);
      this.fh.filters.should.have.length(2);
    });
  });

  describe('#getFilesByFilter()', function(){
    it('should return a promise', function(){
      this.fh.addFilter({
        name: 'txt',
        files: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter().should.be.instanceOf(Promise);
    });

    it('should return an empty array if zero files found', function(done){
      this.fh.addFilter({
        name: 'empty',
        files: '*.empty',
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
        files: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area1/').then(function(files){
        files[0].should.have.property('path');
        files[0].should.have.property('command');
      }).then(done);
    });

    it('should take multiple paths and the results should all come back together', function(done){
      this.fh.addFilter({
        name: 'txt',
        files: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area1/', './test/sandbox/area2/').then(function(files){
        files.should.have.length(4);
      }).then(done);
    });

    it('should not be recursive without a globstar', function(done){
      this.fh.addFilter({
        name: 'txt',
        files: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/').then(function(files){
        files.should.have.length(0);
      }).then(done);
    });

    it('should be recursive with a globstar', function(done){
      this.fh.addFilter({
        name: 'txt',
        files: '**/*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/').then(function(files){
        files.should.have.length(4);
      }).then(done);
    });

    it('should return three text files from area1', function(done){
      this.fh.addFilter({
        name: 'txt',
        files: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area1/').then(function(files){
        files.should.have.length(3);
      }).then(done);
    });

    it('should return one log file from area2', function(done){
      this.fh.addFilter({
        name: 'log',
        files: '*.log',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area2/').then(function(files){
        files.should.have.length(1);
      }).then(done);
    });

    it('should run multiple filters and return all results in the same array', function(done){
      this.fh.addFilters([{
        name: 'txt',
        files: '**/*.txt',
        command: 'cat'
      },{
        name: 'log',
        files: '**/*.log',
        command: 'cat'
      }]);
      this.fh.getFilesByFilter('./test/sandbox/').then(function(files){
        files.should.have.length(5);
      }).then(done);
    });

    it('should match individual files', function(done){
      this.fh.addFilter({
        name: 'log',
        match: 'area2',
        files: '*.log',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area2/test1.log').then(function(files){
        files.should.have.length(1);
      }).then(done);
    });

    it('should not match individual files if they are not matched by the files filter', function(done){
      this.fh.addFilter({
        name: 'txt',
        match: 'area2',
        files: '*.txt',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area2/test1.log').then(function(files){
        files.should.be.empty();
      }).then(done);
    });

    it('should not match individual files if they are matched by files filter but not by match', function(done){
      this.fh.addFilter({
        name: 'txt',
        match: 'area1',
        files: '*.log',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area2/test1.log').then(function(files){
        files.should.be.empty();
      }).then(done);
    });

    it('should match if the filter has a match regex', function(done){
      this.fh.addFilter({
        name: 'log',
        match: 'area2',
        files: '*.log',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area2/').then(function(files){
        files.should.have.length(1);
      }).then(done);
    });

    it('should not match if the filter does not match the path', function(done){
      this.fh.addFilter({
        name: 'log',
        match: 'foo',
        files: '*.log',
        command: 'cat'
      });
      this.fh.getFilesByFilter('./test/sandbox/area2/').then(function(files){
        files.should.be.empty();
      }).then(done);
    });
  });
});
