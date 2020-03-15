//引入数据库
var mysql = require('mysql');
//配置数据库
var connt = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'sell'
});

// 创建一个mysql的线程
connt.connect();	


module.exports = connt;