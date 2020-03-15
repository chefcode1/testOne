var express = require('express');
var router = express.Router();

const connt = require('./bd/connt');



// 引入jwt
const jwt = require('jsonwebtoken');
// expressJwt 用于验证token的有效性
const expressJwt = require('express-jwt');
// 秘钥
const secretKey = 'itsource';

var multer = require('multer');


// 使用中间件验证token合法性
router.use(expressJwt ({
  secret:  secretKey 
}).unless({
  //服务器路由请求地址
  path: ['/account/checkLogin','/account/upload', '/users/upload']  // 不需要验证token的地址
}))


// 拦截器
router.use(function (err, req, res, next) {
  // 如果用户的请求 没有携带token 那么错误类型是 UnauthorizedError
  if (err.name === 'UnauthorizedError') {   
      // 如果前端请求不带token 返回错误
      res.status(401).send('无效的token...');//401: 未授权
  }
})



/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});





var storage = multer.diskStorage({
  destination: 'public/upload/account', // 
  filename: function (req, file, cb) {
      // 处理文件格式
      var fileFormat =(file.originalname).split(".");  

      // 获取当前时间戳 用于重命名 
      var filename = new Date().getTime();  
      cb(null, filename + "." + fileFormat[fileFormat.length - 1]); // 拼接文件名
  }
});


// 上传对象
var upload = multer({
  storage
});


// 头像上传
router.post('/upload', upload.single('file'), (req, res) => {

console.log(req.file)

let { filename } = req.file;
res.send({ code: 0, msg:"上传成功!", imgUrl: filename })

// 把之前上传的图片删除
// 	fs.readdir('./public/upload/goods', (err, files) => {
// 		if (err) throw err;
// 		console.log('读取结果:', files)
// 		files.forEach(v => {
// 			if (v !== filename) {
// 				let path = './public/upload/goods/' + v;
// 				fs.unlinkSync(path);
// 			}
// 		})
// 	})
})





/* 修改用户头像 */
router.get('/avataredit', (req, res) => {
	let { imgUrl } = req.query;

	if ( !imgUrl ) {
		res.send({code: 5001, msg: "参数错误!"})
		return;
	} 

	const sql = `update user set imgUrl="${imgUrl}" where id=${req.user.id}`;

	console.log(sql)
	connt.query(sql, (err, data) => {
		if (err) throw err;

		if (data.affectedRows > 0) {
			res.send({code: 0, msg: '头像成功!'})
		} else {
			res.send({code: 1, msg: '修改头像失败!'})
		}
	})
})












/* 个人中心 */
router.get('/accountinfo', (req, res) => {

	const sql = `select * from user where id=${req.user.id}`;
	connt.query(sql, (err, data) => {
		if (err) throw err;
		if (data.length) {
			res.send({ accountInfo: data[0] })
		}
	})
})

//添加账号
router.post('/accountadd', function (req, res) {
  //接收返回的参数
  let { username, password, usergroup } = req.body;
  //判断参数
  if (!(username && password && usergroup)) {
    //如果参数为空则返回错误代码
    res.send({ code: 5001, msg: '参数错误' });
    //参数为空则代码直接放回不再向下运行
    return;

  }
  //编写sql语句
  //将接受到的参数写入表中
  let sql = `insert into user (username, password, usergroup,imgUrl) values ('${username}', '${password}', '${usergroup}','default.jpg')`;
  console.log(sql);

  //执行编写的sql语句
  connt.query(sql, (err, data) => {
    if (err) throw err;
    if (data.affectedRows > 0) {
      res.send({ code: 0, msg: '注册成功' })
    } else {
      res.send({ code: 5002, msg: '注册失败' })
    }

  })


});

//获取账号列表
router.get('/accountlist', function (req, res) {
  //解构返回的数据
  let { curPage,sizePage } = req.query;
  
  //编写sql语句
  //获取总条数
  let sql = `select * from user`;
  
  //获取当前页条数
  let sqlpage = `select * from user order by id desc  limit ${(curPage - 1) * sizePage} , ${sizePage} `
  // console.log( sqlpage );

  //存放总条数
  let total = 0;

  //存放数据
  let curData = [];

  //执行sql语句
  connt.query(sql,function(err,data){
    //如果错误抛出错误
    if(err) throw err;
    
    //如果成功
    if(data.length > 0){

      total = data.length;
     
      
      //执行sqlpage语句console.log(data);
      connt.query(sqlpage,function(err,userdata){
        if (err) throw err;
         curData = userdata;     
         res.send({ total,curData })
      })
    }
    
  })



  
});

//删除单个
router.get('/accountDelOne',(req,res) => {
  let { id } = req.query;
  
  //编写sql语句
  let sql = `delete from user where id = ${id}`;
  //执行sql语句
  connt.query(sql,(err,data) => {
    if(err) throw err;
    if(data.affectedRows > 0){
      res.send({ code:0,msg:'恭喜您，删除成功' })
    }else{
      res.send({ code:1,msg:'sorry,删除失败' })
    }
    
  })

  
})

//删除多个账号
router.get('/accountDelAll',(req,res) => {
  //获取到发送的信息
  let { ids } = req.query;
  //编写sql语句
  let sql = `delete from user where id in (${ ids.join() })`
  //执行sql语句
  connt.query(sql,(err,data) => {

    if(err) throw err;
    if(data.affectedRows > 0){
      res.send({ code:0,msg:'恭喜您，删除成功' })
    }else{
      res.send({ code:1,msg:'sorry,删除失败' })
    }
    
    
  })

  
})

//修改账号信息
router.post('/accountedit', (req, res) => {
  //解构接收的参数
	let { username, usergroup, id } = req.body;
  //判断如果参数为空
	if ( !(username  && usergroup && id) ) {
    //发送错误代码
    res.send({code: 5001, msg: "参数错误!"})
    //直接返回不再向下执行
		return;
	}
  //编写sql语句
  const sql = `update user set username="${username}", usergroup="${usergroup}" where id=${id}`;
  //执行sql语句
	connt.query(sql, (err, data) => {
    //如果错误抛出错误
    if (err) throw err;
    //查看被影响行数是否大于0
		if (data.affectedRows > 0) {
      //大于0返回成功信息
			res.send({
				code: 0,
				msg: '修改账号成功!'
			})
		}
	})
})


// 登录并发送token令牌
router.post('/checkLogin', (req, res) => {

	let {account, password} = req.body;

	if ( !(account && password) ) {
		res.send({code: 5001, msg: "参数错误!"})
		return;
	}

  const sql = `select * from user where username="${account}" and password="${password}"`;
  console.log(sql);
  
	connt.query(sql, (err, data) => {
		if (err) throw err;
		if (data.length) {


      const userInfo = { ...data[0] };
     
      
			//生成token
			const token = jwt.sign(userInfo, secretKey, {
			    expiresIn:  60 * 60 * 2 // token过期时间
			})

			res.send({code: 0, msg: '欢迎你，登录成功', token})
		} else {
			res.send({code: 1, msg: '登录失败，请检查用户名或密码'})
		}
	})
})


//验证旧密码是否正确 
router.get('/checkoldpwd', (req, res) => {
  
  let { oldPwd } = req.query;
  console.log(oldPwd);
  

	if (!oldPwd) {
		res.send({code: 5001, msg: "参数错误!"})
		return;
	}

	if (oldPwd === req.user.password) {
    
		res.send({code: '00', msg: '旧密码正确'})
	} else {
		res.send({code: "11", msg: '原密码错误'})
	}
})



//修改密码 
router.post('/passwordedit', (req, res) => {
	let { newPwd } = req.body;

	if ( !newPwd ) {
		res.send({code: 5001, msg: "参数错误!"})
		return;
	}

	const sql = `update user set password="${newPwd}" where id=${req.user.id}`;
	connt.query(sql, (err, data) => {
		if (err) throw err;
		if (data.affectedRows > 0) {
			res.send({code: 0, msg: '修改密码成功，请重新登录!'})
		} else {
			res.send({code: 1, msg: '修改密码失败!'})
		}
	})
})



module.exports = router;
