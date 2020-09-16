//jshint esversion:6
//require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//const findOrCreate = require('mongoose-findorcreate');

const app = express();
var placeName="";
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


const url = 'mongodb://localhost:27017';
mongoose.connect(url + "/HMSDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);
    

const userSchema = new mongoose.Schema ({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
//userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

//Define Schema
const officeDetail = new mongoose.Schema({
    name: String,
    username: String,
    streetName: String,
    city: String,
    state: String,
    pincode: String,
    phoneNumber: String,
    email: String
});
const OfficeInfo = new mongoose.model("OfficeInfo", officeDetail);


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

/*app.post("/login", function(req, res){
    const username = req.body.userName;
    const password = req.body.password;    
   
    User.find({$and: [ { userName: { $eq: username } }, { password: { $eq: password } } ]}, function(err, users) {
        if (err) {
          console.error(err);
        } else {
            users.forEach(function(users) {
                placeName = users.userName;             
              });          
            res.redirect("/office");
        }
      });  
  });*/
  
  app.post("/login",function(req,res) {
      const usrName=req.body.username; 
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user,function(err){
        if(err) {
            console.log(err);
        } else {
            console.log("Password:"+req.body.password);
            passport.authenticate("local")(req, res, function(){
                placeName = usrName;
                //console.log("PlaceName:" + placeName);
                res.redirect("/office");
                console.log("LOGGED _IN:");
            });
        }
    });

  });

 

/*app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
);*/

/*app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect("/secrets");
    });*/



/*app.get("/office", function (req, res) {
    const userName = placeName;
    const OfficeInfo = mongoose.model("OfficeInfo", officeDetail);
    OfficeInfo.find({"userName": {$eq: userName}}, function(err, foundUsers){
        if (err){
          console.log(err);
        } else {
          if (foundUsers) {
            res.render("office", {userDetails: foundUsers});
          }
        }
      });

});*/

app.get("/office", function (req, res) {
    if (req.isAuthenticated()) {
        const userName = placeName;
        const OfficeInfo = mongoose.model("OfficeInfo", officeDetail);
        OfficeInfo.find({"username": {$eq: userName}}, function(err, foundUsers){
        if (err){
          console.log(err);
        } else {
          if (foundUsers) {
            res.render("office", {userDetails: foundUsers});
          }
        }
      });
    } else {
        res.redirect("/login");
    }
});

/*app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});*/

/*app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;

    
    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function () {
                    res.redirect("/office");
                });
            }
        }
    });
});*/

app.get("/logout", function (req, res) {
   // req.logout();
   req.session.destroy();
    res.redirect("/");
});

app.post("/register", function (req, res) {

    User.register({username: req.body.userName },
        req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            const office = new OfficeInfo({
                name: req.body.name,
                username:req.body.userName,
                streetName: req.body.streetName,
                city: req.body.city,
                state: req.body.state,
                pincode: req.body.pincode,
                phoneNumber: req.body.phoneNumber,
                email: req.body.email
            });
            office.save(function (err) {
                if (!err) {
                    res.redirect("/login");
                }

            });
        }
    });

});



/*app.post("/register", function (req, res) {
    const user = new User({
        userName: req.body.userName,
        password: req.body.password,
        name: req.body.name,
        streetName: req.body.streetName,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
        phoneNumber: req.body.phoneNumber,
        email:req.body.email
    });

    user.save(function (err) {

        if (!err) {
            
            
           
            const office = new OfficeInfo({
                name: req.body.name,
                userName:req.body.userName,
                streetName: req.body.streetName,
                city: req.body.city,
                state: req.body.state,
                pincode: req.body.pincode,
                phoneNumber: req.body.phoneNumber,
                email: req.body.email
            });
            office.save(function (err) {

                if (!err) {
                    res.redirect("/login");
                }

            });



        }

    });


});*/




app.listen(3000, function () {
    console.log("Server started on port 3000.");
});
