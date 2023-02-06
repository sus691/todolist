//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')



const app = express();
 
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret: 'this is my secret',
  saveUninitialized: true,
  resave: true,
  cookie: { secure: false },

}))

app.use(passport.initialize());
app.use(passport.session());






mongoose.connect(process.env.MONGODB_ADDRESS);
mongoose.set("useCreateIndex", true);
mongoose.set("strictQuery", true);





const UserSchema = new mongoose.Schema({


  email:String,
  password:String,
  googleId:String,
  list: Array

});

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

const User = new mongoose.model("User", UserSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/list",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },

  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


// const item1 = new Item({
//   name: "Welcome to your todolist!"
// });

// const item2 = new Item({
//   name: "Hit the + button to add a new item."
// });

// const item3 = new Item({
//   name: "<-- Hit this to delete an item."
// });

// const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


















































app.get("/", function(req, res) {

  res.render("home");
});  



app.get("/auth/google", 
passport.authenticate("google",{ scope: ["profile"] })
);  



app.get('/auth/google/list', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect list.
    console.log(req.isAuthenticated());
    res.redirect('/list');
});
  

app.get("/login", function(req, res) {

  res.render("login");
});  


app.get("/signup", function(req, res) {
  
  res.render("signup");
});  


app.get("/list", function(req, res) {

  console.log(req.isAuthenticated());
  
  // if (req.isAuthenticated()) {
  //   res.render("list");
  // }  else{
  //   res.redirect("/login");
  // }
  

  
    if(req.isAuthenticated()){
        Item.find({}, function(err, foundItems){
      
          if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err){
              if (err) {
                console.log(err);
              } else {
                console.log("Successfully savevd default items to DB.");
              }  
            });  
            res.redirect("/");
          } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
          }  
        });  
      
    }else{  
      res.redirect("/login");
    }  

});  


app.get("/home", function(req, res) {

  res.render("home");
});  



app.get("/about", function(req, res){
  res.render("about");
});  


app.get("/logout", function (req,res) {
  req.logout(function(err) {
    if (err) { console.log(err); }
      res.redirect("/");
  });


})  



   








app.post("/list", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  console.log(itemName);
  
  const item = new Item({
    name: itemName
  });




  if (listName === "Today"){

    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/list" + listName);
    });






    item.save();
    res.redirect("/list");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/list" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});


app.get("/signup", function(req, res) {
  res.render("signup");
});




// app.post("/signup", function(req, res){
  
//   // User.register({username:req.body.username}, req.body.password, function(err, user) {
//   //   if (err) {
//   //     console.log(err)
//   //     res.redirect("/signup");
//   //   }else{
//   //     passport.authenticate("local")(req, res, function () {
//   //       res.redirect("/list");
//   //     })
//   //   }
    


//   // });
  
// });


app.post("/login", function (req,res) {
  
  // const user = new User({
  //   username: req.body.username,
  //   password: req.body.password
  // });


  // req.login(user, function (err) {
  //   if(err){
  //     console.log(err);
  //   }else{
  //     passport.authenticate("local")(req, res, function () {
  //       res.redirect("/list");
  //     });
  //   }

  // });






});




























app.listen(3000, function() {
  console.log("Server started on port 3000");
});
