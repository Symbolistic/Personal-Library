/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const mongoose = require('mongoose');
const MONGODB_CONNECTION_STRING = process.env.DB;


const Schema = mongoose.Schema;

const bookSchema = new Schema({
  title: {type: String, unique: true},
  comments: [String]
})

const Book = mongoose.model("Book", bookSchema);

//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});
// Establish Connection to Database
mongoose.connect(MONGODB_CONNECTION_STRING, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully")
});


module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      Book.find({}, (err, data) => {
        if (err) console.log("Error: " + err);
        // Map out an array of objects for each book in the database along with their info
        let books = data.map(val => {
          return {_id: val._id,
                  title: val.title,
                  commentcount: val.comments.length
                 };
        });
        
        // Display the array of books
        res.send(books) 
      })
    })
    
    .post(function (req, res){
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
    
      if(!title) {
        res.send("Missing title")
      } else {
        Book.exists({title}, (err, result, done) => {
              if(err) {
                console.log(err);
                res.send("Error: " + err)
              } else if(result) {
                res.send("Title already exists");
                //done();
              }
        });

        const newBook = new Book({title})

        newBook.save((err, result) => {
          if(err) {
            console.log("Error: " + err);
          } else {
            res.json({title: result.title, 
                  comments: result.comments, 
                  _id: result._id}); 
          }
        })
      }
  })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      // This deletes ALL ENTRIES
      Book.deleteMany({}, (err, result) => {
        if (err) {
          console.log("Error: " + err);
          res.send("Error: " + err);
        } else {
          res.send("Complete delete successful");
        }
      })
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      Book.findById(bookid, (err, data) => {
        if (err || !data) {
          console.log("Error: " + err);
          res.send("ID doesn't exist")
        } else {
        // If everything is fine, display data
        res.json({title: data.title,
                  _id: data._id, 
                  comments: data.comments})
        }
      })
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
    
      if (!comment) {
        res.send("Missing comment")
      } else {
        Book.findByIdAndUpdate({_id: bookid}, {$push: {comments: comment}}, {useFindAndModify: false, new: true}, 
        (err, data) => {
          if (err) {
            console.log("Error: " + err);
          } else if (!data) {
            res.send(bookid + " does not exist");
          } else {
          // If everything is fine, display data
          res.json({_id: data._id, 
                    title: data.title,
                    comments: data.comments})
          }
        })
      }
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
      Book.findByIdAndDelete(bookid, (err, data) => {
        if(err) {
          console.log("Error: " + err);
          res.send("Error: " + err);
        } else {
          res.send("Delete successful");
        }
      })
    });
  
};
