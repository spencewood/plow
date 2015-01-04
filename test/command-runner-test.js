var should = require('chai').should();
var Promise = require('bluebird');
var CommandRunner = require('../lib/command-runner');

describe('Command runner', function(){
  beforeEach(function(){
    this.cr = new CommandRunner();
  });

  it('should exist', function(){
    should.exist(this.cr);
  });

  describe('#addToken()', function(){
    it('should add a single token', function(){
      this.cr.addToken({
        name: 'name',
        value: 'value'
      });
      this.cr.tokens.should.contain({
        name: 'name',
        value: 'value'
      });
    });

    it('should throw an exception for tokens without a name', function(){
      (function(){
        this.cr.addToken({
          value: 'value'
        });
      }.bind(this)).should.throw(Error, /must be defined/);
    });

    it('should throw an exception for tokens without a value', function(){
      (function(){
        this.cr.addToken({
          name: 'name'
        });
      }.bind(this)).should.throw(Error, /must be defined/);
    });
  });

  describe('#addTokens()', function(){
    it('should add multiple variables', function(){
      this.cr.addTokens([{
        name: 'name1',
        value: 'value1'
      },{
        name: 'name2',
        value: 'value2'
      }]);
      this.cr.tokens.should.contain({
        name: 'name1',
        value: 'value1'
      });
      this.cr.tokens.should.contain({
        name: 'name2',
        value: 'value2'
      });
    });
  });

  describe('#addCommand()', function(){
    it('should add a single command', function(){
      this.cr.addCommand({
        name: 'name',
        run: 'echo'
      });
      this.cr.commands.should.contain({
        name: 'name',
        run: 'echo'
      });
    });

    it('should throw an exception for command without a name', function(){
      (function(){
        this.cr.addCommand({
          run: 'echo'
        });
      }.bind(this)).should.throw(Error, /must be defined/);
    });

    it('should throw an exception for command without a run', function(){
      (function(){
        this.cr.addCommand({
          name: 'name'
        });
      }.bind(this)).should.throw(Error, /must be defined/);
    });
  });

  describe('#addCommands()', function(){
    it('should add multiple commands', function(){
      this.cr.addCommands([{
        name: 'name1',
        run: 'echo'
      },{
        name: 'name2',
        run: 'echo'
      }]);
      this.cr.commands.should.contain({
        name: 'name1',
        run: 'echo'
      });
      this.cr.commands.should.contain({
        name: 'name2',
        run: 'echo'
      });
    });
  });

  describe('#parseFileCommands()', function(){
    it('should return a promise', function(){
      this.cr.addCommand({
        name: 'echo',
        run: 'echo'
      });
      this.cr.parseFileCommands([{
        path: './test/sandbox/area1.txt',
        command: 'echo'
      }]).should.be.instanceOf(Promise);
    });

    it('should throw an error if the command isn\'t found', function(done){
      this.cr.parseFileCommands([{
        path: './test/sandbox/area1.txt',
        command: 'echo'
      }]).then(null, function(err){
        err.should.eql(new Error('command not found'));
      }).then(done);
    });

    it('should should take a filter collection and return an array of commands', function(done){
      this.cr.addCommand({
        name: 'echo',
        run: 'echo'
      });
      this.cr.parseFileCommands([{
        path: './test/sandbox/area1.txt',
        command: 'echo'
      }]).then(function(commands){
        commands.should.be.an.Array;
        commands.length.should.eql(1);
        commands[0].should.equal('echo');
      }).then(done);
    });

    it('should replace variables in the returned command strings', function(done){
      this.cr.addToken({
        name: 'FOO',
        value: 'bar'
      })
      this.cr.addCommand({
        name: 'echo',
        run: 'echo %FOO%'
      });
      this.cr.parseFileCommands([{
        path: './',
        command: 'echo'
      }]).then(function(commands){
        commands[0].should.equal('echo bar');
      }).then(done);
    });

    it('should replace %FILE_NAME% automatically', function(done){
      this.cr.addCommand({
        name: 'echo',
        run: 'echo %FILE_NAME%'
      });
      this.cr.parseFileCommands([{
        path: './test/',
        command: 'echo'
      }]).then(function(commands){
        commands[0].should.equal('echo ./test/');
      }).then(done);
    });

    it('should be able to run a command with no tokens', function(done){
      this.cr.addCommand({
        name: 'echo',
        run: 'echo %FILE_NAME%'
      });
      this.cr.parseFileCommands([{
        path: './test/area2/test1.txt',
        command: 'echo'
      }]).then(function(commands){
        commands[0].should.equal('echo ./test/area2/test1.txt')
      }).then(done);
    });
  });
});
