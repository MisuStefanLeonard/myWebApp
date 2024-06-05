const express = require("express");
const fs= require('fs');
const path=require('path');
const sharp=require('sharp');
const sass=require('sass');
const ejs=require('ejs');
const AccesBD= require("./module_proprii/accesbd.js");
const bodyParser = require('body-parser')

const formidable=require("formidable");
const {Utilizator}=require("./module_proprii/utilizator.js")
const session=require('express-session');
const Drepturi = require("./module_proprii/drepturi.js");

const QRCode = require('qrcode')
const puppeteer  = require('puppeteer')

const Client = require('pg').Client;

var client = new Client({database:"web",
                        user:"stefan1",
                        password:"admin12@",
                        host:"localhost",
                        port:5432});
 client.connect();

//  client.query("select * from unnest(enum_range(null:categ_prajitura))", function(err,rez){
//  })
 

obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname, "resources/scss"),
    folderCss:path.join(__dirname , "resources/css"),
    folderBackup:path.join(__dirname,"backup"),
    protocol: "http://",
    numeDomeniu: "localhost:8080"
}




vect_foldere=["temp","temp1","backup","poze_uploadate"]
for(let folder of vect_foldere){
    let caleFolder=path.join(__dirname,folder)
    if(!fs.existsSync(caleFolder))
    fs.mkdirSync(caleFolder);
}

app= express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.use(session({ // aici se creeaza proprietatea session a requestului (pot folosi req.session)
    secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false
  }));

app.use("/*",function(req, res, next){
    res.locals.optiuniMeniu=obGlobal.optiuniMeniu;
    res.locals.Drepturi=Drepturi;
    if (req.session.utilizator){
        req.utilizator=res.locals.utilizator=new Utilizator(req.session.utilizator);
    }    
    next();
})

app.set("view engine","ejs");

app.use("/resources", express.static(__dirname+"/resources"));
app.use("/poze_uploadate", express.static(__dirname+"/poze_uploadate"));
app.use("/node_modules", express.static(__dirname+"/node_modules"));

// --------------------------utilizatori online ------------------------------------------


function getIp(req){//pentru Heroku/Render
    var ip = req.headers["x-forwarded-for"];//ip-ul userului pentru care este forwardat mesajul
    if (ip){
        let vect=ip.split(",");
        return vect[vect.length-1];
    }
    else if (req.ip){
        return req.ip;
    }
    else{
     return req.connection.remoteAddress;
    }
}

/* utilizatori onnline */

app.all("/*",function(req,res,next){
    let ipReq=getIp(req);
    if (ipReq){ 
        var id_utiliz=req?.session?.utilizator?.id;
        id_utiliz=id_utiliz?id_utiliz:null;
        //console.log("id_utiliz", id_utiliz);
        // TO DO comanda insert (folosind AccesBD) cu  ip, user_id, pagina(url  din request)
        var obiectCerere;
        if(id_utiliz){
            obiectCerere={
                ip: ipReq,
                user_id:id_utiliz,
                pagina: req.url
            }
        }
        else{
            obiectCerere={
                ip: ipReq,
                pagina: req.url
            }
        }
        AccesBD.getInstanta().insert({
            tabel:"webbd.accesari",
            campuri:obiectCerere
        }, function(err, rez){
            if (err){
                console.log(err)
            }
        })
    }
    next(); 
});



function stergeAccesariVechi(){
    AccesBD.getInstanta().delete({
        tabel:"webbd.accesari",
        conditiiAnd:["now() - data_accesare >= interval '10 minutes' "]}, 
        function(err, rez){
            console.log(err);
        })
}
stergeAccesariVechi();
setInterval(stergeAccesariVechi, 10*60*1000);


async function obtineUtilizatoriOnline(){
    try{
        var rez = await client.query("select username, nume, prenume from webbd.utilizatori where id in (select distinct user_id from webbd.accesari where now()-data_accesare <= interval '5 minutes')");
            console.log(rez.rows);
            return rez.rows
        } catch (err) {
            console.error(err);
            return []
        }
}

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get(["/", "/home","/index"],async function(req,res){
    res.render("pages/index",{ip: req.ip,
                            imagini:obGlobal.obImagini.imagini,
                            useriOnline:await obtineUtilizatoriOnline()
                            });
})


// ---------------------------------  cos virtual --------------------------------------



app.use(["/produse_cos","/cumpara"],express.json({limit:'2mb'}));//obligatoriu de setat pt request body de tip json



app.post("/produse_cos",function(req, res){
    console.log(req.body);
    if(req.body.ids_prod.length!=0){
        //TO DO : cerere catre AccesBD astfel incat query-ul sa fie `select nume, descriere, pret, gramaj, imagine from prajituri where id in (lista de id-uri)`
        AccesBD.getInstanta().select({tabel:"webbd.produse", campuri:"nume,descriere,pret,masa,imagine".split(","),conditiiAnd:[`id_produs in (${req.body.ids_prod})`]},
        function(err, rez){
            if(err)
                res.send([]);
            else
                res.send(rez.rows); 
        });
}
    else{
        res.send([]);
    }
 
});


cale_qr=__dirname+"/resources/images/qrcode";
if (fs.existsSync(cale_qr))
  fs.rmSync(cale_qr, {force:true, recursive:true});
fs.mkdirSync(cale_qr);
client.query("select id_produs from webbd.produse", function(err, rez){
    for(let prod of rez.rows){
        let cale_prod=obGlobal.protocol+obGlobal.numeDomeniu+"/produs/"+prod.id_produs;
        //console.log(cale_prod);
        QRCode.toFile(cale_qr+"/"+prod.id+".png",cale_prod);
    }
});




async function genereazaPdf(stringHTML,numeFis, callback) {
    const chrome = await puppeteer.launch();
    const document = await chrome.newPage();
    console.log("inainte load")
    //await document.setContent(stringHTML, {waitUntil:"load"});
    await document.setContent(stringHTML, {waitUntil:"load"});
    
    console.log("dupa load")
    await document.pdf({path: numeFis, format: 'A4'});
    
    console.log("dupa pdf")
    await chrome.close();
    
    console.log("dupa inchidere")
    if(callback)
        callback(numeFis);
}

app.post("/cumpara",function(req, res){
    console.log(req.body);

    if (req?.utilizator?.areDreptul?.(Drepturi.cumparareProduse)){
        AccesBD.getInstanta().select({
            tabel:"webbd.produse",
            campuri:["*"],
            conditiiAnd:[`id_produs in (${req.body.ids_prod})`]
        }, function(err, rez){
            if(!err  && rez.rowCount>0){
                console.log("produse:", rez.rows);
                let rezFactura= ejs.render(fs.readFileSync("./views/pages/factura.ejs").toString("utf-8"),{
                    protocol: obGlobal.protocol, 
                    domeniu: obGlobal.numeDomeniu,
                    utilizator: req.session.utilizator,
                    produse: rez.rows
                });
                console.log(rezFactura);
                let numeFis=`./temp/factura${(new Date()).getTime()}.pdf`;
                genereazaPdf(rezFactura, numeFis, function (numeFis){
                    mesajText=`Stimate ${req.session.utilizator.username} aveti mai jos factura.`;
                    mesajHTML=`<h2>Stimate ${req.session.utilizator.username},</h2> aveti mai jos factura.`;
                    req.utilizator.trimiteMail("Factura", mesajText,mesajHTML,[{
                        filename:"factura.pdf",
                        content: fs.readFileSync(numeFis)
                    }] );
                    res.send("Totul e bine!");
                });
                
            }
        })
    }
    else{
        res.send("Nu puteti cumpara daca nu sunteti logat sau nu aveti dreptul!");
    }
    
});




//trimitere mesaj dinamic in functie de parametri

     app.get("/*.ejs",function(req,res){
        afisareEroare(res,400);
     });

     app.get("/favicon.ico",function(req,res){
        res.sendFile(path.join(__dirname,"resources/favicon/favicon.ico"));
     });

     app.get(new RegExp("^\/[A-Za-z\/0-9]*\/$"),function(req,res){
        afisareEroare(res,403);
     });

     // gradina mea !!
     app.get("/myProducts", function(req, res){
        console.log(req.query)
        var conditieQuery="";
        if (req.query.tip){
            conditieQuery=` where tip_produs='${req.query.tip}'`
        }
        client.query("select * from unnest(enum_range(null::categorie_produs))", function(err, rezOptiuni){
    
            client.query(`select * from webbd.produse ${conditieQuery}`, function(err, rez){
                if (err){
                    console.log(err);
                    afisareEroare(res, 2);
                }
                else{
                    res.render("pages/myProducts", {produse: rez.rows, optiuni:rezOptiuni.rows})
                }
            })
        });
    })

    app.get("/myProduct/:id_produs", function(req, res) {
        client.query('SELECT * FROM webbd.produse WHERE id_produs = $1', [req.params.id_produs], function(err, rez) {
            if (err) {
                console.log(err);
                afisareEroare(res, 2);
            } else {
                res.render("pages/myProduct", { prod: rez.rows[0] });
            }
        });
    });


    // utilizatori


    const generateUsernameSuggestions = async (baseUsername) => {
        const suggestions = [];
        const maxSuggestions = 5; 
        let counter = 1;
    
        while (suggestions.length < maxSuggestions) {
            const newUsername = `${baseUsername}${counter}`;
            const res = await client.query('SELECT * FROM webbd.utilizatori WHERE username = $1', [newUsername]);
            if (res.rowCount === 0) {
                suggestions.push(newUsername);
            }
            counter++;
        }
    
        return suggestions;
    };
    


    app.post("/inregistrare", function(req, res) {
        var username;
        var poza;
        var formular = new formidable.IncomingForm();
    
        formular.parse(req, function(err, campuriText, campuriFisier) {
            console.log("Inregistrare:", campuriText);
    
            console.log("AICIprimul")
            console.log(campuriFisier);
            console.log(poza, username);
            var eroare = "";
    
            // TO DO var utilizNou = creare utilizator
            var utilizNou = new Utilizator();
            try {
                // campurile din inregistrare.esj la values
                utilizNou.setareNume = campuriText.nume[0];
                utilizNou.setareUsername = campuriText.username[0];
                utilizNou.email = campuriText.email[0];
                utilizNou.prenume = campuriText.prenume[0];
                utilizNou.parola = campuriText.parola[0];
                utilizNou.culoare_chat = campuriText.culoare_chat[0];
                utilizNou.poza = poza;
                
                Utilizator.getUtilizDupaUsername(campuriText.username[0], {}, async function(u, parametru, eroareUser) {
                    if (eroareUser == -1) { // nu exista username-ul in BD
                        // TO DO salveaza utilizator
                        console.log("AICI");
                        await utilizNou.salvareUtilizator();
                        res.render("pages/inregistrare", { raspuns: "Inregistrare cu succes!" });
                    } else {
                        console.log("AICI2");
                        eroare += "Mai exista username-ul";
                        const suggestions = await generateUsernameSuggestions(campuriText.username[0]);
                        eroare += ". Sugestii: " + suggestions.join(", ");
                        res.render("pages/inregistrare", { err: "Eroare: " + eroare, suggestions: suggestions });
                    }
                });
    
            } catch (e) {
                console.log(e);
                eroare += "Eroare site; reveniti mai tarziu";
                console.log(eroare);
                res.render("pages/inregistrare", { err: "Eroare: " + eroare });
            }
    
        });
    
        formular.on("field", function(nume, val) {  // 1
            console.log(`--- ${nume}=${val}`);
            if (nume == "username")
                username = val;
        });
    
        formular.on("fileBegin", function(nume, fisier) { //2
            console.log("fileBegin");
            console.log(nume, fisier);
    
            var folderUser = path.join(__dirname, "poze_uploadate", username);
    
            if (!fs.existsSync(folderUser)) {
                fs.mkdirSync(folderUser);
            }
            fisier.filepath = path.join(folderUser, fisier.originalFilename);
            poza = fisier.originalFilename;
            console.log("fileBegin:", poza);
            console.log("fileBegin, fisier:", fisier);
        });
    
        formular.on("file", function(nume, fisier) { //3
            console.log("file");
            console.log(nume, fisier);
        });
    });
    
    app.get("/forgot_password",function(req,res){
        res.render("pages/forgot_password")
    })

    app.post("/forgot_password", function(req,res){
        var formular = new formidable.IncomingForm()

        formular.parse(req, function(err,campText){
            let obiectComanda = {
                tabel: "webbd.utilizatori",
                conditiiAnd:[`email = '${campText.email[0]}'`],
                campuri:["*"]
            }
            AccesBD.getInstanta().select(obiectComanda, function(err , rezQuery){
                if(err){
                    console.log(err)
                }
                else{
                    console.log("in post la forgot_password")
                    let user = rezQuery.rows[0]
                    var utilizatorCurent = new Utilizator(user);
                    console.log(user);
                    let token = "";
                    for(let i = 0 ; i < 50 ; i++){
                        token+=Math.floor(Math.random() * 50);
                    }
                    let email = campText.email[0]
                    /* <a href='http://${Utilizator.numeDomeniu}/${token1}/${utiliz.username.split('').reverse().join('')}/${token2}'>Click aici pentru confirmare</a></p>`,*/
                    utilizatorCurent.trimiteMail("<p>Password reset</p>", "Ai solicitat resetarea parolei.",
                    `<p><a href='http://${Utilizator.numeDomeniu}/${token}/${email}/resetare_parola'>Da click pe acest link pentru resetare</a></p>`
                    )
                    res.redirect(req.url);
                }
            })
        })
    })

    app.get("/:token/:email/resetare_parola" , function(req,res){
        res.render("pages/new_password" , {token: req.params.token , email:req.params.email})
    })



    app.post("/new_password",function(req,res){
        console.log(req.params);
        try {
         
            const form = new formidable.IncomingForm();
            
            form.parse(req,function(err,campuri){
                let parola = campuri.password[0];
                let parolaRepeat = campuri.repeat[0];
                console.log("aici")
                if(parola == parolaRepeat){
                    let parolaCriptata = Utilizator.criptareParola(parola)
                    let email = campuri.email[0];
                    console.log("aici1")
                    let parametriCerere={
                        tabel:"webbd.utilizatori",
                        campuri:{parola: parolaCriptata},
                        conditiiAnd:[`email = '${email}'`]
                    };
                    
                    AccesBD.getInstanta().update(
                        parametriCerere,
                        function(err,rezUpdate){
                            if(err){
                                console.log(err)
                            }else{
                                console.log("Parola a fost schimbata cu succes")
                                console.log("aici2")
                                console.log(rezUpdate.rows[0])
                            }
                        }
                    )
                    console.log("aici3")
                    let obiectComanda = {
                        tabel: "webbd.utilizatori",
                        conditiiAnd:[`email = '${email}'`],
                        campuri:["*"]
                    }

                    AccesBD.getInstanta().select(obiectComanda, function(err , rezQuery){
                        if(err){
                            console.log(err)
                        }
                        else{
                            console.log("aici4")
                            let user = rezQuery.rows[0]
                            var utilizatorCurent = new Utilizator(user);
                            
                            /* <a href='http://${Utilizator.numeDomeniu}/${token1}/${utiliz.username.split('').reverse().join('')}/${token2}'>Click aici pentru confirmare</a></p>`,*/
                            utilizatorCurent.trimiteMail("Noile tale date de logare", "Parola:",
                            `<p style="font-weight=bold;">${parola}</p>`
                            )
                            res.redirect("/index");
                        }
                    })

                }

            })
        } catch (error) {
            console.log(error)
        }
    })


    app.post("/login",function(req, res){
        /*TO DO parametriCallback: cu proprietatile: request(req), response(res) si parola
            
            testam daca a confirmat mailul
        */
        var username;
        var formular= new formidable.IncomingForm()
        
        
        formular.parse(req, function(err, campuriText, campuriFisier ){
            var parametriCallback= {
                req:req,
                res:res,
                parola:campuriText.parola[0]
            }
            Utilizator.getUtilizDupaUsername (campuriText.username[0],parametriCallback, 
                function(u, obparam ){ // proceseazautiliz
                let parolaCriptata = Utilizator.criptareParola(obparam.parola)
                if(u.parola == parolaCriptata && u.confirmat_mail){
                    u.poza=u.poza?path.join("poze_uploadate",u.username, u.poza):"";
                    obparam.req.session.utilizator=u;               
                    obparam.req.session.mesajLogin="Bravo! Te-ai logat!";
                    obparam.res.redirect("/index");
                    
                }
                else{
                    console.log("Eroare logare")
                    obparam.req.session.mesajLogin="Date logare incorecte sau nu a fost confirmat mailul!";
                    obparam.res.redirect("/index");
                }
            })
        });
        
    });

    app.get("/logout", function(req, res){
        req.session.destroy();
        res.locals.utilizator=null;
        res.render("pages/logout");
    });

    //http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}

    /*
    
     [numeDomeniu]/confirmare_inreg/[token1]/[username]/[token2]. Șirurile între paranteze drepte se vor înlocui. 
     Șirul [numeDomeniu] e înlocuit cu numele de domeniu al site-ului, iar șirul [username] cu username-ul utilizatorului cu 
     literele scrise in ordine inversa. Șirul [token1] va fi format din 10 cifre aleatoare. 
     Iar șirul token2 va incepe cu numele utilizatorului, urmat de cratima, 
     si de un sir aleator de litere mari din intervalul A-P de lungime 70.

    */
    app.get("/:token1/:username/:token2",function(req,res){
        /*TO DO parametriCallback: cu proprietatile: request (req) si token (luat din parametrii cererii)
            setat parametriCerere pentru a verifica daca tokenul corespunde userului
        */
        console.log(req.params);
        
        try {
            var parametriCallback= {
                req/*prop obiectului*/:req/*valoarea*/,
                token1:req.params.token1,
                token2:req.params.token2,
                username:req.params.username
            }
            let username = req.params.username.split('').reverse().join('')
            Utilizator.getUtilizDupaUsername(username,parametriCallback ,function(u,obparam){
                let parametriCerere={
                    tabel:"webbd.utilizatori",
                    campuri:{confirmat_mail:true},
                    conditiiAnd:[`cod='${obparam.token1}'`]
                };
                AccesBD.getInstanta().update(
                    parametriCerere, 
                    function (err, rezUpdate){
                        if(err || rezUpdate.rowCount==0){
                            console.log("Cod:", err);
                            afisareEroare(res,3);
                        }
                        else{
                            res.render("pages/confirmare.ejs");
                        }
                    })
            })
        }
        catch (e){
            console.log(e);
            afisareEroare(res,2);
        }
    })

    app.post("/profil", function(req, res){
        console.log("profil");
        if (!req.session.utilizator){
            afisareEroare(res,403)
            return;
        }
        var formular= new formidable.IncomingForm();
     
        formular.parse(req,function(err, campuriText, campuriFile){
            var parolaCriptata=Utilizator.criptareParola(campuriText.parola[0]);
            let obiectParam = {
                tabel:"webbd.utilizatori",
                conditiiAnd: [`id = ${req.session.utilizator.id}`],
                campuri: ["*"]
            }
            // problema la alegeea pozei 
            AccesBD.getInstanta().select(obiectParam, function(err, rezQuery){
                console.log(rezQuery.rows[0])
                let user = rezQuery.rows[0];
                if(rezQuery && user.parola == parolaCriptata){
                    console.log("AM INTRAT")
                    
                    // cale veche
                    let oldPhotoPath = user.poza ? path.join(__dirname, "poze_uploadate", user.username, user.poza) : null;

                    // Save new photo
                    let newPhotoPath = "";
                    // nu vede poza din campuriFile
                    //!!!!!!
                    console.log(campuriFile.poza.filepath);
                    if (campuriFile.poza && campuriFile.poza.size > 0) {
                        console.log("AM INTRAT2")
                        // folder-ul de upload
                        let uploadFolder = path.join(__dirname, "poze_uploadate", user.username);
                        console.log(uploadFolder)
                        // daca user-ul nu a avut fotografie , creem folder
                        if (!fs.existsSync(uploadFolder)) {
                            fs.mkdirSync(uploadFolder, { recursive: true });
                        }
                        newPhotoPath = path.join(uploadFolder, campuriFile.poza.name);
                        console.log(newPhotoPath)
                        console.log(campuriFile.poza.path)
                        fs.renameSync(campuriFile.poza.path, newPhotoPath); // redenumirea fisierului 
                        console.log(campuriFile.poza.path)
                        newPhotoPath = path.relative(__dirname, newPhotoPath); // cale relativa in baza de date
                        console.log(newPhotoPath)
                    }

                    // stergem vechea poza
                    if (oldPhotoPath && fs.existsSync(oldPhotoPath) && newPhotoPath) {
                        console.log("AM INTRAT3")
                        fs.unlinkSync(oldPhotoPath);
                    }

                    console.log("AM INTRAT4")
                    AccesBD.getInstanta().updateParametrizat(
                        
                        {tabel:"webbd.utilizatori",
                        campuri:["nume","prenume","email","culoare_chat","poza"],
                        valori:[
                            `${campuriText.nume[0]}`,
                            `${campuriText.prenume[0]}`,
                            `${campuriText.email[0]}`,
                            `${campuriText.culoare_chat[0]}`,
                            newPhotoPath
                            ],
                        conditiiAnd:[
                            `parola='${parolaCriptata}'`,
                            `username='${campuriText.username[0]}'`
                        ]
                    },         
                    function(err, rez){
                        if(err){
                            console.log(err);
                            afisareEroare(res,2);
                            return;
                        }
                        if (rez.rowCount==0){
                            console.log("AM INTRAT5")
                            res.render("pages/profil",{mesaj:"Update-ul nu s-a realizat. Verificati parola introdusa."});
                            return;
                        }
                        else{            
                            //actualizare sesiune
                            req.session.utilizator.nume= campuriText.nume[0];
                            req.session.utilizator.prenume= campuriText.prenume[0];
                            req.session.utilizator.email= campuriText.email[0];
                            req.session.utilizator.culoare_chat= campuriText.culoare_chat[0];
                            req.session.utilizator.poza = newPhotoPath;
                            res.locals.utilizator=req.session.utilizator;
                        }
            
            
                        res.render("pages/profil",{mesaj:"Update-ul s-a realizat cu succes."});
            
                    });
                }else{
                    res.render("pages/profil",{mesaj:"Parola nu corespunde!!!!"});
                }
           
            })
           
     
        });
    });

    app.get("/useri", function(req, res){
        
        if(req?.utilizator?.areDreptul(Drepturi.vizualizareUtilizatori)){
            var obiectComanda= {
                tabel: "webbd.utilizatori",
                campuri:["*"],
                conditiiAnd:[]
            };
            AccesBD.getInstanta().select(obiectComanda, function(err, rezQuery){
                console.log(err);
                res.render("pages/useri", {useri: rezQuery.rows});
            });
            
        }
        else{
            afisareEroare(res, 403);
        }
        
    });
    
    
    
    
    app.post("/sterge_utiliz", function(req, res){
        /* TO DO
        * in if testam daca utilizatorul din sesiune are dreptul sa stearga utilizatori
        * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii
     */
        if(req?.utilizator?.areDreptul(Drepturi.stergereUtilizatori)){
            var formular= new formidable.IncomingForm();
     
            formular.parse(req,function(err, campuriText, campuriFile){
                    var obiectComanda= {
                        tabel: "webbd.utilizatori",
                        conditiiAnd: `id = ${campuriText.id_utiliz[0]}`
                    }; 
                    AccesBD.getInstanta().delete(obiectComanda, function(err, rezQuery){
                    console.log(err);
                    res.redirect("pages/useri");
                });
            });
        }else{
            afisareEroare(res,403);
        }
        
    })

    /* BLOCARE/DEBLOCARE USERI */
    /* BLOCARE/DEBLOCARE USERI */

    app.post("/block_user",async(req,res) => {
        if(req?.utilizator?.areDreptul(Drepturi.stergereUtilizatori)){
            const userId = req.body.id
            var obiectComanda = {
                tabel: "webbd.utilizatori",
                conditiiAnd: [`id = ${userId}`],
                campuri: ["*"]
            };
            const users = await AccesBD.getInstanta().selectAsync(obiectComanda, function(err,rezQuery){
                console.log(err);
            })

            // nu vede user-ul
            if(users.length > 0){
                const user = users[0];
                console.log("aici");
                let updateComanda = {
                    tabel: "webbd.utilizatori",
                    conditiiAnd: [`id = ${user.id}`],
                    setari: {
                        confirmat_mail: false
                    }
                }
                const updatedUser = await AccesBD.getInstanta().updateAsync(updateComanda, function(err,rezQuery){
                    console.log(err);
                    res.redirect("pages/useri");
                })

            }
        }else{
            afisareEroare(res,403);
        }
    
    });


    app.post("/unblock_user",async(req,res) => {
        if(req?.utilizator?.areDreptul(Drepturi.stergereUtilizatori)){
            const userId = req.body.id
            var obiectComanda = {
                tabel: "webbd.utilizatori",
                conditiiAnd: [`id = ${userId}`],
                campuri: ["*"]
            };
            const users = await AccesBD.getInstanta().selectAsync(obiectComanda, function(err,rezQuery){
                console.log(err);
            })

            // nu vede user-ul
            if(users.length > 0){
                const user = users[0];
                console.log("aici");
                let updateComanda = {
                    tabel: "webbd.utilizatori",
                    conditiiAnd: [`id = ${user.id}`],
                    setari: {
                        confirmat_mail: true
                    }
                }
                console.log("aici2")
                const updatedUser = await AccesBD.getInstanta().updateAsync(updateComanda, function(err,rezQuery){
                    console.log(err);
                    res.redirect("/useri");
                })

            }
        }else{
            afisareEroare(res,403);
        }
    
    });

    
    /* BLOCARE/DEBLOCARE USERI */
    /* BLOCARE/DEBLOCARE USERI */


    app.get("/edit_products", function(req, res){
        
        if(req?.utilizator?.areDreptul(Drepturi.vizualizareUtilizatori)){
            var obiectComanda= {
                tabel: "webbd.produse",
                campuri:["*"],
                conditiiAnd:[]
            };
            AccesBD.getInstanta().select(obiectComanda, function(err, rezQuery){
                console.log(err);
                client.query("select * from unnest(enum_range(null::categorie_produs))", function(err, rezCategorie){
                    client.query("select * from unnest(enum_range(null::tipuri_produse))", function(err, rezTip){
                        res.render("pages/edit_products", {produse: rezQuery.rows , categorie:rezCategorie.rows,tip:rezTip.rows});
                    });
                });
               
            });
            
        }
        else{
            afisareEroare(res, 403);
        }
        
    });

    app.post("/adauga_produs", function (req, res) {
        const form = new formidable.IncomingForm();
        
        if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
            fs.mkdirSync(path.join(__dirname, 'uploads'));
        }
        
        form.uploadDir = path.join(__dirname, 'uploads'); 
        form.keepExtensions = true;
        
        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error(err);
                res.render("pages/edit_products", { err: "Eroare: Eroare la încărcarea fișierului" });
                return;
            }
    
            let eroare = "";
    
            try {
                const numeF = fields.nume_prod;
                const descriereF = fields.descriere;
                const pretF = fields.pret;
                const tipF = fields.tip_produs;
                const categorieF = fields.categorie_produs;
                const masaF = fields.masa;
                const dimensiuneF = fields.dimensiune;
                const specificatii_tehniceF = typeof fields.specificatii === 'string' ? fields.specificatii.split(",") : [];
                const uz_multipluF = fields.gr_rad_uz === 'true';
                const reparatF = fields.gr_rad_reparat === 'true';
    
                // Handle file upload
                const file = files.poza;
                if (!file || !file.path) {
                    eroare += "Niciun fișier încărcat.";
                    res.render("pages/edit_products", { err: "Eroare: " + eroare });
                    return;
                }
    
                const oldPath = file.path;
                const newPath = path.join(__dirname, 'resources', 'myGallery', file.name);
    
                // Move the file to the desired directory
                fs.rename(oldPath, newPath, (err) => {
                    if (err) {
                        console.error(err);
                        eroare += "Eroare la salvarea fișierului";
                        res.render("pages/edit_products", { err: "Eroare: " + eroare });
                        return;
                    }
    
                    var obiectComanda = {
                        tabel: "webbd.produse",
                        setari: {
                            nume: numeF,
                            descriere: descriereF,
                            pret: pretF,
                            tip: tipF,
                            categorie: categorieF,
                            masa: masaF,
                            dimensiune: dimensiuneF,
                            specificatii_tehnice: specificatii_tehniceF,
                            uz_multiplu: uz_multipluF,
                            reparat: reparatF,
                            poza: file.name 
                        }
                    }
    
                    AccesBD.getInstanta().insert(obiectComanda);
                    
                    res.render("pages/edit_products", { success: "Produsul a fost adăugat cu succes!" });
                });
            } catch (e) {
                console.log(e);
                eroare += "Eroare site; reveniți mai târziu";
                res.render("pages/edit_products", { err: "Eroare: " + eroare });
            }
        });
    });
    

     app.get("/*", function(req, res){

        try {
            res.render("pages"+req.url, function(err, rezHtml){
            
                    if (err){
                        if (err.message.startsWith("Failed to lookup view")){
                            afisareEroare(res,404);
                            console.log("Nu a gasit pagina: ", req.url)
                        }
                        
                    }
                    else{
                        res.send(rezHtml);
                    }
                
            });         
        }
        catch (err1){
            if (err1.message.startsWith("Cannot find module")){
                afisareEroare(res,404);
                console.log("Nu a gasit resursa: ", req.url)
            }
            else{
                afisareEroare(res);
                console.log("Eroare:"+err1)
            }
        }
    
    })

function initErori(){
    var continut = fs.readFileSync(path.join(__dirname+"/views/json/erori.json")).toString("utf-8");
    obGlobal.obErori=JSON.parse(continut);
    for(let eroare of obGlobal.obErori.info_erori){
        eroare.imagine=path.join(obGlobal.obErori.cale_baza,eroare.imagine)
    }
    obGlobal.obErori.eroare_default=path.join(obGlobal.obErori.cale_baza,obGlobal.obErori.eroare_default.imagine);
}

function afisareEroare(res,_identificator,_titlu,_text,_imagine){
    var cale = path.join(__dirname+"/views/pages/eroare.ejs");
    let eroare=obGlobal.obErori.info_erori.find(
        function(elem){
            return elem.identificator==_identificator;
        }
    )
    if(!eroare){
        let eroare_default=obGlobal.obErori.eroare_default;
        res.render(cale,{
            titlu: _titlu || eroare_default.titlu ,
            text: _text || eroare_default.text ,
            imagine: _imagine || eroare_default.imagine,
        }) //al doilea arg este locals
    }
    else {
        if(eroare.status)
             res.status(eroare.identificator)
        res.render(cale,{
            titlu: _titlu || eroare.titlu ,
            text: _text || eroare.text ,
            imagine: _imagine || eroare.imagine,
        }) 
    }
}

initErori();


function initImagini(){
    var continut= fs.readFileSync(path.join(__dirname+"/resources/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);

    //for (let i=0; i< vErori.length; i++ )
    for (let imag of vImagini){
        [numeFis, ext]=imag.cale_relativa.split(".");
        let caleFisAbs=path.join(caleAbs,imag.cale_relativa);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
        imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" )
        imag.cale_relativa=path.join("/", obGlobal.obImagini.cale_galerie, imag.cale_relativa )
        
    }
}
initImagini();



function compileazaScss(caleScss, caleCss){
    console.log("cale:",caleCss);
    if(!caleCss){

        let numeFisExt=path.basename(caleScss);
        let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss=numeFis+".css";
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss )
    

    let caleBackup=path.join(obGlobal.folderBackup, "resources/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup,{recursive:true})
    }
    
    // la acest punct avem cai absolute in caleScss si  caleCss
    //TO DO
    let numeFisCss=path.basename(caleCss);
    if (fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resources/css",numeFisCss ))// +(new Date()).getTime()
    }
    rez=sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css)
    //console.log("Compilare SCSS",rez);
}
//compileazaScss("a.scss");
vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}


fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    console.log(eveniment, numeFis);
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})



app.listen(8080);
console.log("Serverul a pornit");