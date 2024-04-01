const express = require("express");
const fs = require('fs');
const path = require("path");
// const path=require('path');
// const sharp=require('sharp');
// const sass=require('sass');
// const ejs=require('ejs');


app = express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.set("view engine","ejs");

app.use("/resources", express.static(__dirname+"/resources"));

// app.get("/", function(req,res){
//     res.sendFile(__dirname+"/index.html")
// })

app.get(["/","/home","/index"], function(req,res){
    res.render("pages/index",{
        ip:req.ip
    });
})


// cu write putem sa trimitem pe aceeasy /cerere mai multe get-uri

app.get("/data" , function(req,res, next){
    res.write("Data :")
    next();
})

app.get("/data" , function(req,res){
    res.write("" + new Date());
    res.end()
})

obGlobal = {
    obErori: null
}

vect_foldere=["temp" , "temp1"]
for(let folder of vect_foldere){
    let caleFolder = path.join(__dirname, folder)
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder);
    }
}

app.get("/favicon.ico" , function(req,res){
    res.sendFile(path.join(__dirname,"resources/favicon/favicon.ico"))
})

app.get("/*.ejs" , function(req,res){
    afisareEroare(res,400);
})

app.get(new RegExp("^\/[A-Za-z\/0-9]*\/$"), function(req,res){
    afisareEroare(res,403);
})

app.get("/*", function(req, res){
    try {
        res.render("pagini"+req.url, function(err, rezHtml){


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


function initErrors(){

    var continut = fs.readFileSync(path.join(__dirname, "views/errors/erori.json")).toString("utf-8")
    console.log(continut);
    obGlobal.obErori = JSON.parse(continut);
    for(let eroare of obGlobal.obErori.info_erori){
        eroare.imagine= path.join(obGlobal.obErori.cale_baza,eroare.imagine)
    }
    obGlobal.obErori.eroare_default=path.join(obGlobal.obErori.cale_baza,obGlobal.obErori.eroare_default.imagine)

}

initErrors()

function afisareEroare(res, _identificator, _titlu , _text , _imagine){
    let eroare = obGlobal.obErori.info_erori.find(
        function(elem){
            return elem.identificator == _identificator
        }
    )
    if(!eroare){
        let eroare_def = obGlobal.obErori.eroare_default
        res.render("fragments/eroare", {
            titlu: _titlu || eroare_def.titlu,
            text: _text || eroare_def.text,
            imagine: _imagine || eroare_def.imagine
        }) // al doilea argument este locals
    }else{
        if(eroare.status)
            res.status(eroare.identificator)
        res.render("fragments/eroare", {
            titlu: _titlu || eroare.titlu,
            text: _text || eroare.text,
            imagine: _imagine || eroare.imagine
        })
        
    }
}



app.listen(8080);
console.log("Serverul a pornit");