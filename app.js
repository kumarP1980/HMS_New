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

const ageCalc = require("age-calculator");
let {
  AgeFromDateString,
  AgeFromDate
} = require('age-calculator');

const app = express();
var placeName = "";
var clinicName = "";
var personsDetail =[];
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


//const url = 'mongodb://localhost:27017';
const url = 'mongodb+srv://admin-kumar:provider852@cluster-blog-cj9jb.mongodb.net';
mongoose.connect(url + "/HMSDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema({
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

const personDetails = new mongoose.Schema({
    fname: String,
    lname: String,
    username: String,
    dob:Date,
    age:Number,
    streetName: String,
    city: String,
    state: String,
    pincode: String,
    phoneNumber: String,
    email: String
});
const PersonInfo = new mongoose.model("PersonInfo", personDetails);


app.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.render('office', {
            clinicName: clinicName
          });
    } else {
        res.render("home");
    }    
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/enroll", function (req, res) {    
    if (req.isAuthenticated()) {
        res.render('enroll', {
            clinicName: clinicName
          });
    }
});

app.get("/search", function (req, res) {    
    if (req.isAuthenticated()) {
        res.render('search', {
            clinicName: clinicName,
            personsDetail: personsDetail
          });
    }
});

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                placeName = req.body.username;
                res.redirect("/office");
            });
        }
    });

});

app.post("/search",function(req, res) {
    const fname = req.body.fname;
    const dob = req.body.dob;
    const phnum = req.body.phoneNumber;    
    const uname = placeName;
    if (req.isAuthenticated()) {
        const PersonInfo = new mongoose.model("PersonInfo", personDetails);
        PersonInfo.find({ "username": { $eq: uname } , "fname":{ $eq: fname}, "dob":{ $eq: dob}, "phoneNumber":{ $eq: phnum}
                 }, function (err, foundPerson) {            
            if (err) {
                console.log(err);
            } else {
                if (foundPerson) {
                    res.render("search", { personsDetail: foundPerson, clinicName: clinicName });
                }
            }
        });
    }


});


app.get("/office", function (req, res) {
    if (req.isAuthenticated()) {
        const userName = placeName;
        const OfficeInfo = mongoose.model("OfficeInfo", officeDetail);
        OfficeInfo.find({ "username": { $eq: userName } }, function (err, foundUsers) {
            clinicName = foundUsers[0].name;
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("office", { clinicName: foundUsers[0].name });
                }
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.post("/enroll",function(req, res) {
    let dob = req.body.dob;
    let age = new AgeFromDateString(dob.toString()).age;
    const person = new PersonInfo({
        fname: req.body.fname,
        lname: req.body.lname,
        username: placeName,
        dob: dob,
        age: age,
        streetName: req.body.streetName,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
        phoneNumber: req.body.phoneNumber,
        email: req.body.email
    });
    person.save(function (err) {
        if (!err) {
            res.redirect("/office");
        }
    });  
});

app.get("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/");
});

app.post("/register", function (req, res) {

    User.register({ username: req.body.userName },
        req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                const office = new OfficeInfo({
                    name: req.body.name,
                    username: req.body.userName,
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

app.listen(process.env.PORT || 3000, function() {
    console.log("Sever has started on port 3000......");
  });
