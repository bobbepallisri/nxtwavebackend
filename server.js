const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();


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

    app.get("/students/", async (request, response) => {
      const getStudentsQuery = `
        SELECT
          *
        FROM
          student
        ORDER BY
          sid;`;
      const studentssArray = await db.all(getStudentsQuery);
      response.send(studentssArray);
    });

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



  


    app.listen(4000, () => {
      console.log("Server Running at http://localhost:4000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();