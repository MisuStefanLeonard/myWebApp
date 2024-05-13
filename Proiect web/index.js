const express = require("express");
const fs= require('fs');
const path=require('path');
const sharp=require('sharp');
const sass=require('sass');
const ejs=require('ejs');

const Client = require('pg').Client;

var client = new Client({database:"web",
                        user:"stefan1",
                        password:"admin12@",
                        host:"localhost",
                        port:5432});
 client.connect();

 client.query("select * from unnest(enum_range(null:categ_prajitura))", function(err,rez){
 })
 

obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname, "resources/scss"),
    folderCss:path.join(__dirname , "resources/css"),
    folderBackup:path.join(__dirname,"backup"),
}

vect_foldere=["temp","temp1","backup"]
for(let folder of vect_foldere){
    let caleFolder=path.join(__dirname,folder)
    if(!fs.existsSync(caleFolder))
    fs.mkdirSync(caleFolder);
}

app= express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.set("view engine","ejs");

app.use("/resources", express.static(__dirname+"/resources"));
app.use("/node_modules", express.static(__dirname+"/node_modules"));


app.get(["/", "/home","/index"],function(req,res){
    res.render("pages/index",{ip: req.ip,imagini:obGlobal.obImagini.imagini});
})


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
    


     app.get("/produse", function(req, res){
        console.log(req.query)
        var conditieQuery="";
        if (req.query.tip){
            conditieQuery=` where tip_produs='${req.query.tip}'`
        }
        client.query("select * from unnest(enum_range(null::categ_prajitura))", function(err, rezOptiuni){
    
            client.query(`select * from webbd.prajituri ${conditieQuery}`, function(err, rez){
                if (err){
                    console.log(err);
                    afisareEroare(res, 2);
                }
                else{
                    res.render("pages/produse", {produse: rez.rows, optiuni:rezOptiuni.rows})
                }
            })
        });
    })

     

     app.get("/produs/:id" , function(req,res){
        client.query(`select * from webbd.produse where id = ${req.params.id_produs}`, function(err,rez){
            if(err){
                console.log(err);
                afisareEroare(res,2);
            }else{
                res.render("views/produse" , {prod: rez.rows[0]})
            }
        })
     })

     app.get("/*", function(req, res){

        try {
            res.render("pages"+req.url, function(err, rezHtml){
            
                    if (err){
                        if (err.message.startsWith("Failed to lookup view")){
                            afisareEroare(res,404);
                            console.log("Nu a gasit pagina: ", req.url)
                        }
                        
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