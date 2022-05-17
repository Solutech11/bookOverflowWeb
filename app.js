//initializing express
const express= require('express')
const app =express()

//required middleware
const _ = require('lodash');

//cross origin resource sharing
const cors = require("cors")
app.use(cors())


//node fetch
const fetch = require('node-fetch')

//http logging request
const morgan = require('morgan')
app.use(morgan('dev'))



//accepting pdf
const fileupload = require('express-fileupload');
app.use(fileupload({createParentPath:true}))


//accepting data
const bodyparser= require('body-parser');
app.use(bodyparser.urlencoded({extended:true}))
app.use(bodyparser.json())


//static file
app.use(express.static(__dirname+'static'));

//view engine
app.set('view engine','ejs' );

//session
const session = require('express-session');
const { response } = require('express');
app.use(session({secret:'samoaJoe', saveUninitialized:true, resave:true}))


//port
const port = process.env.Port || 4000

app.listen(port,()=>{
    console.log("http://localhost:4000/");
})


//apikey 
const apikey = "samoaJoe"
//website
const website ='http://localhost:5000'


//home page
app.get('/', async(req,res)=>{
    const sess= req.session;
    if (sess.username && sess.email) {
        res.render('home')
    }else{
        res.redirect("/register", {msg:""})
    }
})


//register get
app.get('/register', (req,res)=>{
    res.render('register',{msg:''})
})


//post register
app.post('/register', async(req,res)=>{
    // console.log(req.body);\
    const datas = req.body
    const sess = req.session

    console.log(JSON.stringify(datas));
    await fetch (website+"/addStudent/"+apikey,{
        method: 'POST',
        body:JSON.stringify(datas),
        headers:{"Content-type": "application/json; charset=UTF-8"}
    }).then(response=>response.json()).then((json)=>{
        const responseApi = json;
        // console.log(responseApi);
        if(responseApi.access== true){
            if (responseApi.item==true) {
                if (responseApi.upload==true) {
                    sess.username = datas.Username 
                    sess.email = datas.email
                    res.redirect('/verify')
                }else{
                    if (responseApi.existing==true) {
                        if(responseApi.verified==true){
                            if (responseApi.existtype=="username") {
                                res.render('register',{msg: "username already exist"})
                            }else{
                                res.render('register',{msg:'email already exist'})
                            }
                        }else{
                            if (responseApi.existtype=="username") {
                                res.render('register',{msg: "username already exist but not verified"})
                            }else{
                                res.render('register',{msg:'email already exist but not verified'})
                            }
                        }
                    } else {
                        res.render('register',{msg:"error processing"})
                    }
                }
            }else{
                res.render('register',{msg:"fill complete form"})
            }
        }else{
            res.redirect('/notfound')
        }
    }).catch(err=>console.log(err));

    
})


//get login
app.get('/login', (req,res)=>{
    res.render('login',{msg:''})
})


//postlogin
app.post('/login', async(req,res)=>{
    const sess= req.session;
    const inputes = JSON.stringify(req.body);

    fetch(website+'/login/'+apikey, {
        method:'POST',
        body:inputes,
        headers:{"Content-type": "application/json; charset=UTF-8"}
    }).then(response=>response.json()).then((json)=>{
        const data = json;
        // console.log(data);
        if (data.access==true){
            if (data.fill== true) {
                if (data.user==true) {
                    sess.username=data.data.Username;
                    sess.email = data.data.email;
                    if (data.verified==true) {
                        res.redirect('/')
                    }else{
                        res.redirect('/verify')
                    }
                }else{
                    res.render('login',{msg:'incorrect details'})
                }
            }else{
                res.render('login',{msg:'fill form complete'})
            }
        }else{
            res.redirect('/lost')
        }
    })
})


//get verify
app.get('/verify', async(req,res)=>{
    const user = req.session.username
    const email = req.session.email

    //user nd email
    if (user && email){
        fetch(website+'/verify/'+apikey+'/'+user, {
            method: 'GET',
            headers:{"Content-type": "application/json; charset=UTF-8"}
        }).then(response=>response.json()).then((json)=>{
            const data =json;
            if(data.access==true){
                if (data.user==true){
                    if (data.pastverf==false) {
                        if (data.mailedVerf==true) {
                            res.render('verify',{msg:'verification code sent to email', user:user})
                        }else{
                            res.render('verify',{msg:'error sending email', user})
                        }
                    } else {
                        res.redirect('/')
                    }
                }else{
                    sess.destroy((err)=>{
                        if (err) {
                            console.log(err);
                        } else {
                            res.redirect('/')
                        }
                    })
                }
            }else{
                res.redirect('/lost')
            }
        })
    }else{
        res.redirect('/lost')
    }    
    
    
})


//post verify
app.post('/verify', async(req,res)=>{
    const user = req.session.username
    const email = req.session.email
    const sess = req.session
    const otp = JSON.stringify(req.body);
    if (user && email) {
        fetch(website+"/verify/"+apikey+"/"+user,{
            method:'POST',
            body:otp,
            headers:{"Content-type": "application/json; charset=UTF-8"}
        }).then(response=>response.json()).then((json)=>{
            // console.log('yes');
            const data= json;

            if (data.access==true) {
                if (data.user==true) {
                    if (data.otp== true) {
                        if (data.pastverf== false) {
                            if (data.mailedVerf==true) {
                                res.render('completeVerification', {user})
                            } else {
                                res.render('completeVerification', {user})
                            }
                        } else {
                            res.redirect('/')
                        }
                    } else {
                        res.render('verify',{msg:'wrong otp', user})
                    }
                } else {
                    sess.destroy((err)=>{
                        if (err) {
                            console.log(err);
                        }else{
                            res.redirect('/')
                        }
                    })
                }
            } else {
                res.redirect('/lost')
            }

        })
    }
})


//getting a full user
app.get("/user/:username",async(req,res)=>{
    const user = req.session.username
    const email = req.session.email
    const userlink = req.params.username
    if (user && email) {
        fetch(website+"/getafulluser/"+userlink, {
            method:'GET',
            headers: {"Content-type": "application/json; charset=UTF-8"}
        }).then(response.json()).then((json)=>{
            const data= json;
            if (data.access==true) {
                if (data.userAvailable==true) {
                    if (data.assAvailable) {
                        res.render('userfind',{assignmets:true, user, userdata:data.userdata, userAss : data.assignmets})
                    } else {
                        res.render('userfind',{assignmets:false, user, userdata:data.userdata})
                        
                    }
                } else {
                    res.redirect('/login')
                }
            } else {
                res.json('/lost')
            }
        })
    }else{
        res.redirect('login');
    }
})



app.use((req,res)=>{
    res.status(404).render('404')
})