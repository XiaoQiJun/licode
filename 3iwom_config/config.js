var env = process.argv[2] || process.env.NODE_ENV || 'development';
console.log('use config file : ' + env + '.js');
module.exports = require('./' + env + '.js');