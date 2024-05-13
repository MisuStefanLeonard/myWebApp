
window.addEventListener("load" , function(){
   
    document.getElementById("inp-pret").onchange = function(){
        document.getElementById("infoRange").innerHTML = `(${this.value})`
    }


    document.getElementById("filtrare").onclick 
        = function(){
            var input_nume = document.getElementById("inp-nume")
                                     .value
                                     .toLowerCase()
                                     .trim()
            
            var radio_calorii = document.getElementsByName("gr_rad")
            let inpCalorii;
            for(let rad of radio_calorii){
                if(rad.checked){
                    inpCalorii=rad.value
                    break;
                }
            }
            let minCalorii,maxCalorii
            if(inpCalorii !="toate"){
                vCal = inpCalorii.split(":")
                minCalorii = parseInt(vCal[0])
                maxCalorii = parseInt(vCal[1])
            }

            var inp_pret = parseInt(document.getElementById("inp-pret").value);

            var inp_categorie =document.getElementById("inp-categorie").value

            var produse = document.getElementsByClassName("produs")
            for(let produs of produse){

                let val_nume = produs.getElementsByClassName("val-nume")[0].innerHTML
                                                                           .toLowerCase()
                                                                           .trim()
                let val_calorii = parseInt(produs.getElementsByClassName("val-calorii")[0].innerHTML)
                                                                           
                let val_pret = parseFloat(produs.getElementsByClassName("val-pret")[0].innerHTML)


                let val_categorie = produs.getElementsByClassName("val-categorie")[0].innerHTML
                                                                           .toLowerCase()
                                                                           .trim()
                

                let cond1 = val_nume.startsWith(input_nume);

                let cond2 = (inpCalorii=="toate" || minCalorii <= val_calorii && val_calorii < maxCalorii);

                let cond3= (val_pret > inp_pret)

                let cond4 = inp_categorie==val_categorie || val_categorie=="toate"

                if(cond1 && cond2 && cond3 && cond4){
                    produs.style.display="block";
                }else{
                    produs.style.display="none";
                }

            }
        }

    document.getElementById("resetare").onclick= function(){
            
        document.getElementById("inp-nume").value="";
        
        document.getElementById("inp-pret").value=document.getElementById("inp-pret").min;
        document.getElementById("inp-categorie").value="toate";
        document.getElementById("i_rad4").checked=true;
        var produse=document.getElementsByClassName("produs");
        document.getElementById("infoRange").innerHTML="(0)";
        for (let prod of produse){
            prod.style.display="block";
        }
    }
})





