
// Required packages
const expressSanitizer = require('express-sanitizer');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const moment = require('moment');
//const findOrCreate = require('mongoose-findorcreate');

const ageCalc = require("age-calculator");
let {
    AgeFromDateString,
    AgeFromDate
} = require('age-calculator');

const app = express();

// Global variables
var placeName = "";
var clinicName = "";
var personsDetail = [];
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(expressSanitizer());

// Session Management
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// DB Details
//const url = 'mongodb://localhost:27017';
const url = 'mongodb+srv://admin-kumar:provider852@cluster-blog-cj9jb.mongodb.net';
mongoose.connect(url + "/HMSDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

//Define Office Schema
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

//Define Person Schema
var diagnosisData = new mongoose.Schema({
    details: String,
    diagnosisDate: String
});

const DiagnosisData = new mongoose.model("DiagnosisData", diagnosisData);

var medicationData = new mongoose.Schema({
    name: String, dose: String, startDate: Date, endDate: Date
})

const MedicationData = new mongoose.model("MedicationData",medicationData);

const personDetails = new mongoose.Schema({
    fname: String,
    lname: String,
    username: String,
    dob: Date,
    age: Number,
    streetName: String,
    city: String,
    state: String,
    pincode: String,
    phoneNumber: String,
    email: String,
    insurance: { providerName: String, groupNum: String, policyNum: String, effectiveFrom: Date, providerPhoneNum: String },
    medication: [medicationData],
    diagnosis: [diagnosisData]
});


const PersonInfo = new mongoose.model("PersonInfo", personDetails);

// Home Route
app.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.render('office', {
            clinicName: clinicName
        });
    } else {
        res.render("home");
    }
});

// Login Route
app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log("Not valid user");
            res.render("login");
        } else {
            passport.authenticate("local", { failureRedirect: '/login' })(req, res, function () {
                placeName = req.body.username;
                res.redirect("/office");
            });
        }
    });

});

// Register Route
app.get("/register", function (req, res) {
    res.render("register");
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
                    pincode: req.body.pinCode,
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

// Define Enroll Route
app.get("/enroll", function (req, res) {
    if (req.isAuthenticated()) {
        res.render('enroll', {
            clinicName: clinicName
        });
    }
});

app.post("/enroll", function (req, res) {
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
        pincode: req.body.pinCode,
        phoneNumber: req.body.phoneNumber,
        email: req.body.email,
        insurance: {
            providerName: req.body.providerName,
            groupNum: req.body.groupNum,
            policyNum: req.body.policyNum,
            effectiveFrom: req.body.effectiveFrom,
            providerPhoneNum: req.body.providerPhoneNum
        },

    });
    person.save(function (err) {
        if (!err) {
            res.redirect("/office");
        }
    });
});

// Define Search Route
app.get("/search", function (req, res) {
    if (req.isAuthenticated()) {
        res.render('search', {
            clinicName: clinicName,
            personsDetail: personsDetail
        });
    }
});

app.post("/search", function (req, res) {
    const fname = req.body.fname;
    const dob = req.body.dob;
    const phnum = req.body.phoneNumber;
    const uname = placeName;
    if (req.isAuthenticated()) {
        const PersonInfo = new mongoose.model("PersonInfo", personDetails);
        PersonInfo.find({
            "username": { $eq: uname }, "fname": { $eq: fname }, "dob": { $eq: dob }, "phoneNumber": { $eq: phnum }
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

//Define Delete Route
app.get("/delete/:personID", function (req, res) {
    const requestedPersonId = req.params.personID;
    PersonInfo.findOne({
        _id: requestedPersonId
    }, function (err, blogs) {
        res.render("delete", {
            //title: blogs.title,
            //blogText: blogs.blog
        });
    });
});

//Define Edit Route
app.get("/edit/:personID", function (req, res) {
    const requestedPersonId = req.params.personID;
    PersonInfo.findOne({
        _id: requestedPersonId
    }, function (err, personDtls) {
        const time = moment(personDtls.dob);
        const dob = time.format("MM/DD/YYYY");
        const effFromTime = moment(personDtls.insurance.effectiveFrom);
        const effFrom = effFromTime.format("MM/DD/YYYY");
        res.render("edit", {
            id: personDtls._id,
            fname: personDtls.fname,
            lname: personDtls.lname,
            dob: dob,
            age: personDtls.age,
            streetName: personDtls.streetName,
            city: personDtls.city,
            state: personDtls.state,
            pinCode: personDtls.pincode,
            phoneNumber: personDtls.phoneNumber,
            email: personDtls.email,
            clinicName: clinicName,
            providerName:personDtls.insurance.providerName,
            groupNum:personDtls.insurance.groupNum,
            policyNum:personDtls.insurance.policyNum,
            effFrom:effFrom,
            providerPhone:personDtls.insurance.providerPhoneNum
        });
    });
});

//Define Modify Route
app.post("/modify", function (req, res) {
    let personID = req.body.personID;
    let streetName = req.body.streetName;
    let city = req.body.city;
    let state = req.body.state;
    let pinCode = req.body.pinCode;
    let phoneNumber = req.body.phoneNumber;
    let email = req.body.email;
    const filter = { _id: personID };
    const update = { streetName: streetName, city: city, state: state, pincode: pinCode, phoneNumber: phoneNumber, email: email };
    mongoose.set('useFindAndModify', false);
    PersonInfo.findOneAndUpdate(filter, update, function (err, person) {
    });
    if (req.isAuthenticated()) {
        res.redirect("/search");
    }
});

//Define view Route
app.get("/view/:personID", function (req, res) {
    const requestedPersonId = req.params.personID;
    let diagnosisDtls = [];
    PersonInfo.findOne({
        _id: requestedPersonId
    }, function (err, personDtls) {
        var areaCode = (personDtls.phoneNumber).substr(0, 3);
        var phoneNum = (personDtls.phoneNumber).substr(3, 9);
        const effFromTime = moment(personDtls.insurance.effectiveFrom);
        const effFrom = effFromTime.format("MM/DD/YYYY");
        console.log("Medications:" + personDtls.medication);
        res.render("view", {
            id: personDtls._id,
            fname: personDtls.fname,
            lname: personDtls.lname,
            age: personDtls.age,
            streetName: personDtls.streetName,
            city: personDtls.city,
            state: personDtls.state,
            pinCode: personDtls.pincode,
            areaCode: areaCode,
            phoneNumber: phoneNum,
            email: personDtls.email,
            clinicName: clinicName,
            providerName: personDtls.insurance.providerName,
            groupNum: personDtls.insurance.groupNum,
            policyNum: personDtls.insurance.policyNum,
            effectiveFrom: effFrom,
            providerPhone: personDtls.insurance.providerPhoneNum,            
            diagnosisDtls:personDtls.diagnosis,
            medicationDtls:personDtls.medication
        });
    });
});

//Define Office Route
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

//Define Contacts Route
app.get("/contact", function (req, res) {
    if (req.isAuthenticated()) {
        const userName = placeName;
        const OfficeInfo = mongoose.model("OfficeInfo", officeDetail);
        OfficeInfo.find({ "username": { $eq: userName } }, function (err, foundUsers) {           
            var areaCode = (foundUsers[0].phoneNumber).substr(0, 3);
            var phoneNum = (foundUsers[0].phoneNumber).substr(3, 9);
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("contact", { 
                        clinicName: foundUsers[0].name,
                        areaCode: areaCode,
                        phoneNumber: phoneNum,
                        email: foundUsers[0].email,
                        streetName:foundUsers[0].streetName,
                        city:foundUsers[0].city,
                        state:foundUsers[0].state,
                        pinCode:foundUsers[0].pincode
                     });
                }
            }
        });
    } else {
        res.redirect("/login");
    }
});

//Define logout Route
app.get("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/");
});

// Define Medication Route
app.get("/medication/:personID", function (req, res) {
    const requestedPersonId = req.params.personID;
    if (req.isAuthenticated()) {
        res.render('medication', {
            clinicName: clinicName,
            id: requestedPersonId
        });
    }
});

app.post("/medication", function (req, res) {
    let personID = req.body.personID;
    let medSize = ((req.body.meds).length);  
 
    for (i=0;i<medSize;i++) {
        let medName = req.body.meds[i].medName;
        let dose = req.body.meds[i].dose;
        let startDt = req.body.meds[i].startDate;
        let endDt = req.body.meds[i].endDate;
        const medicationInfo = new MedicationData({
        name: medName,
        dose: dose,
        startDate:startDt,
        endDate:endDt
    });
    medicationInfo.save(function (err) {
    });
    console.log("Value of i:" + i);
    console.log(medicationInfo);
    const filter = { _id: personID};
    mongoose.set('useFindAndModify', false);
    PersonInfo.findById(filter, function (err, person) {
        person.medication.push(medicationInfo);
        person.save(function(err){
            // no err here!
            if(err) {
                console.log(err);
            }    
        }); 
    }); 
    console.log("Data Save in Person");
    }
    if (req.isAuthenticated()) {
        res.redirect("/view/" + personID);
    } 
        
});


// Define Diagnosis route
app.get("/diagnosis/:personID", function (req, res) {
    const requestedPersonId = req.params.personID;
    if (req.isAuthenticated()) {
        PersonInfo.findOne({
            _id: requestedPersonId
        }, function (err, personDtls) {
            res.render("diagnosis", {
                id: personDtls._id,
                fname: personDtls.fname,
                lname: personDtls.lname,
                clinicName: clinicName
            });
        });
    }
});

app.post("/diagnosis", function (req, res) {
    let personID = req.body.personID;
    let options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    let today = new Date().toLocaleDateString("en-US", options);
    let diagnosis = req.sanitize(req.body.body.content);
    const diagnosisInfo = new DiagnosisData({
        details: diagnosis,
        diagnosisDate: today 
    });
    diagnosisInfo.save(function (err) {
    });
    const filter = { _id: personID};
    const update = { diagnosis: diagnosisInfo };
    mongoose.set('useFindAndModify', false);
    PersonInfo.findById(filter, function (err, person) {
        person.diagnosis.push(diagnosisInfo);
        person.save(function(err){
            // no err here!
            if(err) {
                console.log(err);
            } else if (req.isAuthenticated()) {
                res.redirect("/view/" + personID);
            }    
        });   
    }); 
    
    
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Sever has started on port 3000......");
});
