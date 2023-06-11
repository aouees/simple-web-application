const mysql = require('mysql')
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'web2'
  })

  connection.connect((err)=>{
      if(!err)
      console.log("Database Connected")
      else
      console.log(err)

  })
  module.exports=connection