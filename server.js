var express = require('express');
var path = require('path');
var bodyparser = require('body-parser');
const sessions = require('express-session');
let db = require('./model/db');
const moment = require('moment');
var multer=require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,path.join( __dirname,"public","images"))
    },
    filename: function (req, file, cb) { 
      cb(null,  req.session.username+'-'+file.originalname)
    }
  })
  
const upload = multer({ storage: storage })

const store = new sessions.MemoryStore();

var app = express();
var bodyparse = bodyparser.urlencoded({ extended: true })

app.set('view engine', 'ejs')
app.set('views', 'views')
// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;
//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: true,
    store
}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    var s = req.session
    if (!s.username) {
        res.render('login', { msgs: '', msg: '', title: 'Login & signup', username: '' })
    }
    else {
        res.redirect('/homepage')
    }
})
app.get('/login',(req,res)=>{
    res.render('login', { msgs: '', msg: '', title: 'Login & signup', username: '' })
})
app.post('/login', bodyparse, (req, res) => {
    let user = req.body.username
    let pass = req.body.password
    let q = 'SELECT username, password, name,img FROM user where username= ? and password = ? ;'
    db.query(q,[user,pass],(err,result)=>{
        if(!err){
            if (result[0]) {
                req.session.username = result[0]['username']
                req.session.name = result[0]['name']
                req.session.pass=result[0]['password']
                req.session.img=result[0]['img']
                res.redirect('/homepage')
            }
            else{
                res.render('login', { msgs: '', msg: 'Your username or password not correct', title: 'Login & signup', username: '' })
            }
        }
        else{
            res.render('login', { msgs: '', msg: 'Your username or password not correct', title: 'Login & signup', username: '' })
        }
    })

})
app.post('/signup', bodyparse, (req, res) => {
    let n = req.body.name, un = req.body.newusername, ps = req.body.newpassword
    let q = 'INSERT INTO user(username,password,name)VALUES(?,?,?);'
    db.query(q, [ un, ps, n ], (err, result) => {
        if (!err) {
            req.session.username = un
            req.session.name = n
            req.session.pass=ps
            req.session.img='test.jpg'
            res.redirect('/homepage')
        }
        else {
            res.render('login', { msgs: 'error in signup', msg: '', title: 'Login & signup', username: '' })
        }
    })
})
app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})
app.get('/homepage', (req, res) => {
    let q=''
    if(req.query.statement){
        q='select id,content ,user_s,publishDate,topic,img from statment join user on user_s=username where content like "%'+req.query.statement+'%" order by publishDate desc;'
    }
    else if(req.query.topic){
        q='select id,content ,user_s,publishDate,topic,img from statment join user on user_s=username where topic like "%'+req.query.topic+'%" order by publishDate desc;'
    }
    else{
        q='select id,content ,user_s,publishDate,topic,img from statment join user on user_s=username   order by publishDate desc;'
    }
    db.query(q,(err,result)=>{
        if(err){
            res.send(err)
        }
        else{
            result.forEach(element => {
                element.publishDate=moment(element.publishDate).fromNow()
            });
            if (req.session.username) {
                res.render('homepage', {statements:result, title: 'Homepage', username: req.session.name })
            }
            else {
                res.render('homepage', { statements:result,title: 'Homepage', username: '' })
            }
        }
    })
    
    
})

app.get('/mystatement', (req, res) => {
    if (req.session.username) {
        let d=new Date().getUTCDate()
        let q='select * from statment where user_s=? order by publishDate desc;'
        db.query(q,[req.session.username],(err,result)=>{
            if(err){
                res.send(err)
            }
            else{

                result.forEach(element => {
                    element.publishDate=moment(element.publishDate).fromNow()
                    element.img=req.session.img
                });
                res.render('myStatement', { title: 'myStatement', username: req.session.name ,statements:result})
            }
        })
    }
    else {
        res.render('login', { msgs: '', msg: '', title: 'Login & signup', username: '' })
    }
})


app.get('/profile', (req, res) => {
    if (req.session.username) {
        res.render('profile', {msgs: '', title: 'profile', username: req.session.name,user:req.session.username ,pass:req.session.pass,imgName:req.session.img })
    }
    else {
        res.render('login', { msgs: '', msg: '', title: 'Login & Signup', username: '' })
    }
})
app.post('/updateUser',bodyparse,(req,res)=>{
    let n = req.body.name, un = req.body.newusername, ps = req.body.newpassword
    let q = 'UPDATE user SET username = ? , password = ? , name = ? WHERE username = ?;'
    db.query(q, [ un, ps, n ,req.session.username], (err, result) => {
        if (!err) {
            req.session.username = un
            req.session.name = n
            req.session.pass=ps
            res.redirect('/homepage')
        }
        else {
            res.redirect('/profile')
        }
    })

})
app.post('/addStatement',bodyparse,(req,res)=>{
    let s = req.body.statement, t = req.body.topic
    let q = 'INSERT INTO statment (content, topic,user_s,publishDate) VALUES (?,?,?,?)'
    db.query(q,[s,t,req.session.username,new Date()],(err,result)=>{
        if(!err){
            res.redirect('/mystatement')
        }
        else{
            res.send(err);
        }
    })
})
app.get('/delete',(req,res)=>{
    if(req.session.name){

        var id=req.query.id;
        q='delete from statment where id=?'
        db.query(q,[id],(err,result)=>{
        if(!err){
            res.redirect('/myStatement')
        }
        else{
            res.send(err)
        }
    })
}else{
    res.redirect('/')
}
})
app.get('/update',(req,res)=>{
    if (req.session.name) {
        
        var id=req.query.id
        q='select * from statment where id=? and user_s=?'
        db.query(q,[id,req.session.username],(err,result)=>{
            if(!err){
                if(result.length==0){
                    res.send("ERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR")
                }
                else{
                    res.render('updateform', { title: 'update my statement', username: req.session.name ,s:result[0]})
                }
            }
            else{
                res.send(err)
            }
        })
    }
    else{
        res.redirect('/')
    }
})
 app.post('/update',bodyparse,(req,res)=>{
    let s = req.body.statement, t = req.body.topic
    let id=req.body.id
    let q = 'update statment set content=?, topic=?,publishDate=? where id=?'
    db.query(q,[s,t,new Date(),id],(err,result)=>{
        if(!err){
            res.redirect('/mystatement')
        }
        else{
            res.send(err);
        }
    })
 })
 app.post('/updateImg',upload.single('myfile'),(req,res)=>{
    let q='update user set img=? where username=?'
    db.query(q,[req.file.filename,req.session.username],(err,result)=>{
        if(err){
            console.log(err)
        }
        req.session.img=req.file.filename
        res.redirect('/profile')
    })

})
var server = app.listen(5000, () => {
    console.log("Server Run http://127.0.0.1:5000");
});