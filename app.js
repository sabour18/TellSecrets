//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Makes a session
app.use(session({
    secret: "ourlittlesecret.",
    resave: false,
    saveUninitialized: false
}));

// initializes
app.use(passport.initialize());
app.use(passport.session());

// Starts mongodb server
mongoose.set('strictQuery', false);
mongoose.connect("mongodb+srv://admin:admin@cluster0.o432ssq.mongodb.net/secretsDB");

// Scehema for what a user looks like
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const secretSchema = new mongoose.Schema({
    secret: String
});

userSchema.plugin(passportLocalMongoose);

// encrypt the password
const secret = "THISISOURLITTLESECRET";
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"]});

// Collection for the Schema
const User = new mongoose.model("User", userSchema);

const Secret = new mongoose.model("Secret", secretSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){

    res.render("home");
});


app.get("/login", function(req, res){
    
    if(req.isAuthenticated()){
        var id = req.user.id;
        console.log(id);
    }else{
        
    }

    res.render("login");
});

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local");
            res.redirect("/secrets");
        }
    });
});


app.get("/register", function(req, res){

    res.render("register");
});

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log("User already exists");

            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    })
});

app.get("/secrets", function(req, res){
    Secret.find(function(err, result){
        if(err){
            console.log(err);
        }else{
            if(result){
                //console.log(result);
                res.render("secrets", {secrets: result});
            }
        }
    });
});

app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;

    const secret = new Secret({
        secret: submittedSecret
    });

    
    secret.save()
    
    res.redirect("/secrets");
});














app.listen(3000, function(){
    console.log("server started on port 3000");
})