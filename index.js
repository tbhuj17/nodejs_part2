// const express = require("express")

// const app = express();
// app.get("/date",(request, response)=>{
//     const data = new Date();
//     // response.send(data)
//     response.send("Hi How are you");
// })

// app.listen(3000);

const express = require("express");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname,"goodreads.db");

let db = null;

const initializeServerAndDb = async(req,res)=>{
    try {
        db = await open({
            filename:dbPath,
            driver:sqlite3.Database
        })
        app.listen(3005,()=>{
            console.log("server started")
        });
    } catch (e) {
        console.log(e);
        process.exit(1)
    }
}

initializeServerAndDb();

app.get("/books",async(req,res)=>{
    const getBookQuery = ` select * FROM book order by book_id `;
    const booksArray = await db.all(getBookQuery);
    res.send(booksArray);
});

app.get("/book_author",async(req,res)=>{
    const booksID = `select name from author`;

    const getBookID = await db.all(booksID);
    res.send(getBookID);
});

app.get("/books/:bookID",async(req,res)=>
{
    const bookID = req.params;
    const getBookQuery = `select * from book where book_id = ${bookID}`;
    const book = await db.get(getBookQuery);
    res.send(book);
});

// Post book API

app.post("/books", async(req, res)=>{
    const bookDetails = req.body;
    const {
        title,
        authorId,
        rating,
        ratingCount,
        reviewCount,
        description,
        pages,
        dateOfPublication,
        editionLanguage,
        price,
        onlineStores,
      } = bookDetails;
    const addBookQuery = `
        INSERT INTO
          book (title,author_id,rating,rating_count,review_count,description,pages,date_of_publication,edition_language,price,online_stores)
        VALUES
          (
            '${title}',
             ${authorId},
             ${rating},
             ${ratingCount},
             ${reviewCount},
            '${description}',
             ${pages},
            '${dateOfPublication}',
            '${editionLanguage}',
             ${price},
            '${onlineStores}'
          );`;

    const dbResponse = await db.run(addBookQuery);
    res.send("Book Added");
});

// PUT book API request. JO book hai ussi ko update karna hai.

app.put("/books/:bookID/", async(req, res)=>{
    const {bookID} = req.params;
    const bookDetails = req.body;
    const {
        title,
        authorId,
        rating,
        ratingCount,
        reviewCount,
        description,
        pages,
        dateOfPublication,
        editionLanguage,
        price,
        onlineStores,
      } = bookDetails;
    const updateBookQuery = `
        UPDATE
          book
        SET
          title = '${title}',
          author_id = ${authorId},
          rating = ${rating},
          rating_count = ${ratingCount},
          review_count = ${reviewCount},
          description = '${description}',
          pages = ${pages},
          date_of_publication = '${dateOfPublication}',
          edition_language = '${editionLanguage}',
          price = ${price},
          online_stores = '${onlineStores}'
        WHERE
          book_id = ${bookID};`;
    
          await db.run(updateBookQuery);
    res.send("book updated.")
}); 

// DELETE book API

app.delete("/books/:bookID", async(req, res)=>{
    const {bookID} = req.params;
    const deleteBookQuery = `
        DELETE FROM
          book
        WHERE
          book_id = ${bookID};`;
    
          await db.run(deleteBookQuery);
    res.send("book deleted.")
});

app.post("/register/", async (req, res) => {
  const { username, password, name, gender, location } = req.body;
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser);
  if (dbUser === undefined) {
    const insertUserQuery = `
      INSERT INTO user(username, password, name, gender, location)
      VALUES
      (
        '${username}',
        '${hashedPassword}',
        '${name}',
        '${gender}',
        '${location}'
      );`;
    await db.run(insertUserQuery);
    res.send("User created");
  } else {
    res.status(400).send("User already exists.");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    res.status(400).send("User not found");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      res.send("Login success");
    } else {
      res.status(400).send("Password is incorrect");
    }
  }
});

app.post("/login2", async(req, res)=>
{
  const{username, password} = req.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser);
  if(dbUser === undefined)  {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if(isPasswordMatched){
      const payload = {
        username : username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      res.send({jwtToken});
    } else {
      res.status(400);
      res.send("Invalid Password");
    }
  }
});
