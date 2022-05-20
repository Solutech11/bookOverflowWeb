//initializing express
const express= require('express')
const app =express()

//required middleware
const _ = require('lodash');

//cross origin resource sharing
const cors = require("cors")
app.use(cors())

//open
// const open = require('open');

//node fetch
const fetch = require('node-fetch')

//http logging request
const morgan = require('morgan')
app.use(morgan('dev'))


//accepting data
const bodyparser= require('body-parser');
app.use(bodyparser.urlencoded({limit: '20mb', extended: true}))
app.use(bodyparser.json({limit: '20mb', extended: true}))


//accepting pdf
const fileupload = require('express-fileupload');
app.use(fileupload({createParentPath:true}))




//static file
app.use(express.static('static'));

//view engine
app.set('view engine','ejs' );

//session
const session = require('express-session');
// const { response } = require('express');
// const { response } = require('express');
// const { json } = require('express/lib/response');
app.use(session({secret:'samoaJoe', saveUninitialized:true, resave:true}))


//port
const port = process.env.PORT || 4000
// const port = process.env.Port

app.listen(port,(err)=>{
    if (err) {
        console.log(err);
    }else{
        
    }
    console.log("website running");
})


//apikey 
const apikey = "samoaJoe"
//website
const website ='https://book-overflow-api1234567890.herokuapp.com'


//home page
app.get('/', async(req,res)=>{
    const sess= req.session;
    if (sess.username && sess.email) {
        await fetch(website+'/getallbook/'+apikey,{
            method:'GET',
            headers:{"Content-type": "application/json; charset=UTF-8"}
        }).then(response=>response.json()).then((json)=>{
            const data = json;
            if (data.access==true) {
                if (data.item== true) {
                    res.render('home', {user:sess.username, item:true, books:data.data})
                } else {
                    res.render('home',{user:sess.username, item:false})
                }
            } else {
                res.redirect('/lost')
            }
        })
    }else{
        res.redirect("/register")
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

    // console.log(JSON.stringify(datas));
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

    await fetch(website+'/login/'+apikey, {
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


//logout
app.get('/logout',(req,res)=>{
    const sess= req.session
    if (sess.username || sess.email) {
        sess.destroy((err)=>{
            if (err) {
                console.log(err);
            } else {
                res.redirect('/')
            }
        })
    }else{
        res.redirect('/')
    }
})


//get verify
app.get('/verify', async(req,res)=>{
    const user = req.session.username
    const email = req.session.email
    console.log(user);

    //user nd email
    if (user && email){
        await fetch(website+'/verify/'+apikey+'/'+user, {
            method: 'GET',
            headers:{"Content-type": "application/json; charset=UTF-8"}
        }).then(response=>response.json()).then((json)=>{
            const data =json;
            console.log(data);
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
        }).catch(err=>console.log(err))
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
        await fetch(website+"/verify/"+apikey+"/"+user,{
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
    }else{
        res.redirect('/')
    }
})


//getting a full user
app.get("/user/:user",async(req,res)=>{
    const user = req.session.username
    const email = req.session.email
    const userlink = req.params.user
    if (user && email) {
        await fetch(website+"/getafulluser/"+userlink, {
            method:'GET',
            headers: {"Content-type": "application/json; charset=UTF-8"}
        }).then(response=>response.json()).then((json)=>{
            const data= json;
            // console.log(data);
            if (data.access==true) {
                if (data.userAvailable==true) {
                    if (data.assAvailable==true) {
                        res.render('userfind',{assignmets:true, user, userdata:data.userData, userAss : data.assignments, website, msg:''})
                    } else {
                        res.render('userfind',{assignmets:false, user, userdata:data.userData, website, msg:''})
                        
                    }
                } else {
                    res.redirect('/lost')
                }
            } else {
                res.redirect('/lost')
            }
        })
    }else{
        res.redirect('/');
    }
})

//getting full user by id
app.get("/userid/:id",async(req,res)=>{
    const user = req.session.username
    const email = req.session.email
    const userlink = req.params.id
    // console.log(userlink);
    if(userlink.length==24){
        if (user && email) {
            await fetch(website+"/getafulluserbyId/"+userlink, {
                method:'GET',
                headers: {"Content-type": "application/json; charset=UTF-8"}
            }).then(response=>response.json()).then((json)=>{
                const data= json;
                // console.log(data);
                if (data.access==true) {
                    if (data.userAvailable==true) {
                        if (data.assAvailable==true) {
                            res.render('userfind',{assignmets:true, user, userdata:data.userData, userAss : data.assignments, website,msg:''})
                        } else {
                            res.render('userfind',{assignmets:false, user, userdata:data.userData, website,msg:''})
                            
                        }
                    } else {
                        res.redirect('/lost')
                    }
                } else {
                    res.redirect('/lost')
                }
            })
        }else{
            res.redirect('/');
        }
    }else{
        res.redirect('/lost')
    }
    
})


//get single item
app.get('/item/:id', async(req,res)=>{
    const user = req.session.username
    const email = req.session.email
    const idurl= req.params.id;

    if (idurl.length==24) {
        if (user && email) {
            await fetch(website+'/item/'+idurl,{
                method:'GET',
                headers:{"Content-type": "application/json; charset=UTF-8"}
            }).then(response=>response.json()).then((json)=>{
                const data = json;
                // console.log(data);
                if (data.access==true) {
                    if (data.item==true) {
                        if (data.user==true) {
                            res.render('bookdetail',{username:data.userdata.Username,itemdata:data.itemdata, website})
                            
                        } else {
                            res.render('bookdetail',{username:'Anonymous',itemdata:data.itemdata, website})
                        }
                        // res.render('bookdetail',{data})
                    }else{
                        res.redirect('/lost')
                    }
                } else {
                    res.redirect('/lost')
                }
            })
        } else {
            res.redirect('/')
        }
    } else {
        res.redirect('/lost')
    }
})

// res.json({access:true, item:true,uservalid:true,deleted:true})
//delete item
app.get('/delete/:itemid/:userid', async(req,res)=>{
    const user = req.session.username;
    const email = req.session.email;
    const itemId = req.params.itemid;
    const userid = req.params.userid;

    if(itemId.length==24 && userid.length==24){
        if (user && email) {

            await fetch(website+'/delete/'+apikey+'/'+itemId+'/'+userid,{
                method:'GET',
                headers:{"Content-type": "application/json; charset=UTF-8"}
            }).then(response=>response.json()).then((json)=>{
                const data= json;
                if (data.access==true) {
                    if(data.item==true){
                        if (data.uservalid==true) {
                            if (data.deleted==true) {
                                res.render('deleted')
                            }else{
                                res.write('<script>Alert("unable to delete")</script>')
                            }
                        }else{
                            res.redirect('/lost')
                        }
                    }else{
                        res.redirect('/lost')
                    }
                } else {
                    res.redirect('/lost')
                }
            })

        } else {
            res.redirect('/register');
        }
    }else{
        res.redirect('/lost')
    }
})


//addbook. get
app.get('/addbook', (req,res)=>{
    const user = req.session.username
    const email = req.session.email
    if (user && email) {
        res.render('addbook', {msg:'', user,website})
    } else {
        res.redirect('/')
    }

})


//search
app.post('/search',async(req,res)=>{
    const search = req.body.search;
    const user = req.session.username
    const email = req.session.email

    if (user && email) {
        await fetch(website+"/getallbook/"+apikey,{
            method:'GET',
            headers:{"Content-type": "application/json; charset=UTF-8"}
        }).then(response=>response.json()).then((json)=>{
            const data = json;
            console.log(data);
            if (data.access==true) {
                if (data.item== true) {
                    const book = data.data.filter((data)=>{
                        return (data.name).includes(search)
                    })
                    res.render('search',{item:data.item, user, books:book})
                } else {
                    res.render('search',{item:data.item, user})
                }
            }else{
                res.redirect('/lost')
            }
        })
    }else{
        res.redirect('/lost')
    }
})

//app.get
// app.get(/)




app.use((req,res)=>{
    res.status(404).render('404')
})