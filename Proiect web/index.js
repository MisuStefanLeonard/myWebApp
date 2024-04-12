const express = require("express");
const fs= require('fs');
const path=require('path');
const sharp=require('sharp');
const sass=require('sass');
// const ejs=require('ejs');

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


//app.get("/",function(req,res){
//res.sendFile(__dirname+"/index.html")
//})

app.get(["/", "/home","/index"],function(req,res){
    res.render("pages/index",{ip: req.ip,imagini:obGlobal.obImagini.imagini});
})



//trimiterea unui mesaj fix
app.get("/cerere", function(req,res){
res.send("<b>Hello </b><span style='color:red'>world!</span>");
})

//trimitere mesaj dinamic
app.get("/data", function(req,res,next){
    res.write("Data :");
    next();
    });

    app.get("/data", function(req,res){
        res.write(""+new Date());
        res.end();
        });
//trimitere mesaj dinamic in functie de parametri
app.get("/suma/:a/:b", function(req,res){
    var suma=parseInt(req.params.a)+parseInt(req.params.b)
    res.send(""+suma);
     });

     app.get("/*.ejs",function(req,res){
        afisareEroare(res,400);
     });

     app.get("/favicon.ico",function(req,res){
        res.sendFile(path.join(__dirname,"resources/favicon/favicon.ico"));
     });

     app.get(new RegExp("^\/[A-Za-z\/0-9]*\/$"),function(req,res){
        afisareEroare(res,403);
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
    console.log(continut);
    obGlobal.obErori=JSON.parse(continut);
    for(let eroare of obGlobal.obErori.info_erori){
        eroare.imagine=path.join(obGlobal.obErori.cale_baza,eroare.imagine)
    }
    obGlobal.obErori.eroare_default=path.join(obGlobal.obErori.cale_baza,obGlobal.obErori.eroare_default.imagine);
    console.log(obGlobal.obErori);
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
        [numeFis, ext]=imag.fisier.split(".");
        let caleFisAbs=path.join(caleAbs,imag.fisier);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" )
        imag.fisier=path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier )
        
    }
    console.log(obGlobal.obImagini);
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