var should = require('chai').should();
var CommandRunner = require('../lib/command-runner');

describe('Command runner', function(){
  beforeEach(function(){
    this.cr = new CommandRunner();
  });

  it('should exist', function(){
    should.exist(this.cr);
  });
});
