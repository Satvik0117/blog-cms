var express = require("express"),
    app     = express(),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    // expressSanitizer = require("express-sanitizer"),
    passport              = require("passport"),
    User                  = require("./models/user"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose")
    methodOverride = require('method-override');
    
mongoose.connect("mongodb://localhost/blog_app");
app.use(bodyParser.urlencoded({extended: true}));
// app.use(expressSanitizer());
app.set("view engine", "ejs");
// app.use(express.static("./uploads"));
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));
// app.use(express.static('files'))
app.use(methodOverride('_method'));
app.use(require("express-session")({
    secret: "IIAE",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var blogSchema = new mongoose.Schema({
    title: String,
    html: String,
    intro_text: String,
    imgPath:String,
    created:  {type: Date, default: Date.now}
});
var postAsGuestSchema = new mongoose.Schema({
    name: String,
    email: String,
    contact: String,
    message:String
});

var Blog = mongoose.model("Blog", blogSchema);
var PAGuser = mongoose.model("PAGuser", postAsGuestSchema);

const upload = require("./multer/storage.js");



// app.get("/secret1",isLoggedIn, function(req, res){
//     res.send('asdf'); 
//  });
// Auth Routes
app.get("/", function(req, res){
    Blog.find({}, function(err, blogs){
        if(err){
            console.log(err);
        } else {
            res.render("public-index-test", {blogs: blogs}); 
        }
    })
});
app.get("/about",function(req,res){
    res.render("about");
});
app.get("/contact",function(req,res){
    res.render("contact");
});

app.get("/blog-1",function(req,res){
    res.render("blog-1");
});app.get("/blog-2",function(req,res){
    res.render("blog-2");
});app.get("/blog-3",function(req,res){
    res.render("blog-3");
});
app.post("/contact",function(req,res){
    console.log(req.body);
    let newuser = new PAGuser();
    newuser.name=req.body.name;
    newuser.email=req.body.email;
    newuser.contact=req.body.contact;
    newuser.save(()=>{
         
            res.redirect("/");

        
    });

});
app.get("/blog/:id", function(req, res){
    Blog.findById(req.params.id, function(err, blog){
        if(err){
            console.log(err);
        } else {
            // console.log(blog);
            // res.send(blog);
            res.render("single-blog-html", {blog: blog}); 
        }
    })
});
//show sign up form
app.get("/register", function(req, res){
   res.render("register"); 
});
//handling user sign up
app.post("/register", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render('register');
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/secret");
        });
    });
});

// LOGIN ROUTES
//render login form
app.get("/login", function(req, res){
    res.render("admin-login"); 
 });
 //login logic
 //middleware
 app.post("/login", passport.authenticate("local", {
     successRedirect: "/admin/blogs",
     failureRedirect: "/login"
 }) ,function(req, res){
 });
 
 app.get("/logout", function(req, res){
     req.logout();
     res.redirect("/");
 });
 
 
 function isLoggedIn(req, res, next){
     if(req.isAuthenticated()){
         return next();
     }
     res.redirect("/login");
 }
 
app.get("/admin",isLoggedIn, function(req, res){
    res.redirect("/admin/blogs");
});

app.get("/admin/blogs",isLoggedIn, function(req, res){
    Blog.find({}, function(err, blogs){
        if(err){
            console.log(err);
        } else {
            res.render("index", {blogs: blogs}); 
        }
    })
});

app.get("/admin/blogs/new", isLoggedIn,function(req, res){
   res.render("new"); 
});

app.post("/admin/blogs",isLoggedIn, function(req, res){

    // var formData = req.body.blog;
    console.log(req.file);
    upload(req, res, function (err) {
        // need to check if the req.file is set.
        if(req.file == null || req.file == undefined || req.file == ""){
            //redirect to the same url         
            console.log("failed");   
            res.redirect("/");
            
        }else{
            // An error occurred when uploading
            if (err) {
                console.log("failed while uploading");   

                console.log(err);
            }else{
                // Everything went fine
                //define what to do with the params
                //both the req.body and req.file(s) are accessble here
                console.log(req.file);
        
        
                //store the file name to mongodb    
                //we use the model to store the file.
                let newblog = new Blog();
                newblog.imgPath = req.file.filename;
                newblog.html=req.body.html;
                newblog.intro_text=req.body.intro_text;
                newblog.title=req.body.title;


                newblog.save(()=>{
                    if(err){
                        console.log(err);
                    }else{
                        //render the view again    
                        res.redirect("/admin/blogs");
        
                    }
                });

            }
          }

        });

});

app.get("/admin/blogs/:id",isLoggedIn, function(req, res){
   Blog.findById(req.params.id, function(err, blog){
      if(err){
          res.redirect("/admin");
      } else {
          res.render("show", {blog: blog});
      }
   });
});

app.get("/admin/blogs/:id/edit",isLoggedIn, function(req, res){
   Blog.findById(req.params.id, function(err, blog){
       if(err){
           console.log(err);
           res.redirect("/admin")
       } else {
           res.render("edit", {blog: blog});
       }
   });
});

app.put("/admin/blogs/:id",isLoggedIn, function(req, res){
   Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, blog){
       if(err){
           console.log(err);
       } else {
         var showUrl = "/admin/blogs/" + blog._id;
         res.redirect(showUrl);
       }
   });
});

app.delete("/admin/blogs/:id",isLoggedIn, function(req, res){
   Blog.findById(req.params.id, function(err, blog){
       if(err){
           console.log(err);
       } else {
           blog.remove();
           res.redirect("/admin/blogs");
       }
   }); 
});


app.listen(3000,function(){
    console.log('server started');
});