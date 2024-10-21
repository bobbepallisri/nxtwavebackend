const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");

app.use(express.json());



const dbPath = path.join(__dirname, "project.db");

let db = null;


const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.get("/", (request, response) => {
      response.send("Hello World!");
    });
  
    app.get("/date", (request, response) => {
      let date = new Date();
      response.send(`Today's date is ${date}`);
    });
  
  
    app.get("/index", (request, response) => {
      response.sendFile("./index.html", { root: __dirname });
    });

    const authenticateToken=(request,response,next)=>{

      let jwtToken='';
      const authHeader=request.headers['authorization'];
      if(authHeader!== undefined){
        jwtToken=authHeader.split(" ")[1];
      }
      if(jwtToken=== undefined){
        response.status(401);

      }else{
        jwt.verify(jwtToken,'djjjskkllma',async(error,user)=>{
          if(error){
            response.status(401);
            response.send("Invalid JWT Token");
          }else{
            next();
          }
    })
  }
}
    


  

    app.get("/students/",authenticateToken, async (request, response) => {
      
         const getStudentsQuery = `
        SELECT
          *
        FROM
          student
        ORDER BY
          sid;`;
      const studentssArray = await db.all(getStudentsQuery);
      response.send(studentssArray);
            
          })



    app.get("/students/:sId/", async (request, response) => {
      const { sId } = request.params;
      const getStudentQuery = `
        SELECT
          *
        FROM
          student
        WHERE
          sid = ${sId};`;
      const student = await db.get(getStudentQuery);
      response.send(student);
    });

    app.post("/students/",async(request,response)=>{
      const studentDetails=request.body;
      const{sid,sname,sage,gender}=studentDetails;
      const addStudentQuery=`insert into student(sid,sname,sage,gender) values (
      '${sid}',
      '${sname}',
      '${sage}',
      '${gender}'
      );`;

      const dbResponse=await db.run(addStudentQuery);
      const sId=dbResponse.lastId;
      console.log(sId);
      response.send({sid:sId})

    });

// create register user api
     app.post('/users/',async(request,response)=>{
      const {username,name,password,gender,location}=request.body;

      const hashedPassword=await bcrypt.hash(password,10);

      const selectUserQuery=`select * from users where username='${username}';`;

      const dbUser=await db.get(selectUserQuery);

      if(dbUser==undefined){
        //create user in the user table

        const createUserQuery=`insert into users(username,name,password,gender,location) values('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
        await db.run(createUserQuery);
        response.send("user created successfully");

      }else{
        //send invalid username as response
        response.status(400);
        response.send("Username already exists");
      }

     })

     //create login user api 
    
    app.post('/login/',async(request,response)=>{
      const {username,password}=request.body;
      const selectUserQuery=`select * from users where username='${username}';`;

      const dbUser=await db.get(selectUserQuery);
      if(dbUser===undefined){
        //user doesn't exit
        response.status(400)
        response.send("Invalid User")

      }
      else{
        //compare password,hashedpassword
        const isPasswordMatched=await bcrypt.compare(password,dbUser.password);
        if(isPasswordMatched===true){
          const payload={username:username};
          const jwtToken=jwt.sign(payload,'djjjskkllma');
          response.send({jwtToken});
          //response.send("Login Success");

        }
        else{
          response.status(400);
          response.send("Invalid Password");

        }

      }

    })








  


    app.listen(4000, () => {
      console.log("Server Running at http://localhost:4000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();