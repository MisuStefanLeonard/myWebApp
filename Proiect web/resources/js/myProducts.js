window.addEventListener("load", function () {
    document.getElementById("inp-pret").onchange = function () {
        document.getElementById("infoRange").innerHTML = `(${this.value})`
    }
    document.getElementById("inp-dimensiune").onchange = function () {
        document.getElementById("infoRange2").innerHTML = `(${this.value})`
    }

    document.getElementById("filtrare").onclick = function () {
        var input_nume = document.getElementById("inp-nume").value.toLowerCase().trim();
        var radio_masa = document.getElementsByName("gr_rad");
        var radio_uz = document.getElementsByName("gr_rad_masa");

        let val_uz_multiplu;
       

        for(let rad_uz of radio_uz){
            if(rad_uz.checked){
                val_uz_multiplu = rad_uz.value;
                break;
            }
        }

        let minMasa, maxMasa;

        for (let rad of radio_masa) {
            if (rad.checked) {
                let vMasa = rad.value.split(":");
                minMasa = parseInt(vMasa[0]);
                maxMasa = parseInt(vMasa[1]);
                break;
            }
        }

        var inp_pret = parseInt(document.getElementById("inp-pret").value);
        var inp_categorie = document.getElementById("inp-categorie").value
        var produse = document.getElementsByClassName("produs");

        for (let produs of produse) {
            let val_nume = produs.querySelector('.val-nume').textContent.toLowerCase().trim();
            let val_masa = parseInt(produs.querySelector('.val-masa').textContent);
            let val_pret = parseFloat(produs.querySelector('.val-pret').textContent);
            let val_categorie = produs.getElementsByClassName("val-categorie")[0].innerHTML
                                                                                 .toLowerCase()
                                                                                 .trim()
            let VAL_uz_multiplu = produs.getElementsByClassName("val-uz_multiplu")[0].innerHTML.trim();

            let cond1 = val_nume.startsWith(input_nume);
            let cond2 = (isNaN(minMasa) || isNaN(maxMasa) || (val_masa >= minMasa && val_masa < maxMasa));
            let cond3 = (val_pret >= inp_pret);
            let cond4 = val_categorie === inp_categorie || inp_categorie === "toate"
            let cond5 = val_uz_multiplu === "toate" || VAL_uz_multiplu.toLowerCase() === val_uz_multiplu.toLowerCase()

            if (cond1 && cond2 && cond3 && cond4 && cond5) {
                produs.style.display = "block";
            } else {
                produs.style.display = "none";
            }
        }
    }



    document.getElementById("resetare").onclick = function () {
        let txt;
        if(confirm("Are you sure you want to reset the filters?")){
            document.getElementById("inp-nume").value = "";
            document.getElementById("inp-pret").value = document.getElementById("inp-pret").min;
            document.getElementById("inp-categorie").value = "toate";
            document.getElementById("i_rad4").checked = true;
            var produse = document.getElementsByClassName("produs");
            document.getElementById("infoRange").innerHTML = "(0)";

            for (let prod of produse) {
                prod.style.display = "block";
            }
        }
        
    }


    function sorteaza(semn){
        var produse = document.getElementsByClassName("produs");
        
        // Convert HTMLCollection to an array
        var produseArray = Array.from(produse);
        
        produseArray.sort((a, b) => {
        
            let dimensiuneA = parseInt(a.getElementsByClassName("val-dimensiune")[0].innerHTML);
            let dimensiuneB = parseInt(b.getElementsByClassName("val-dimensiune")[0].innerHTML);

            if(dimensiuneA == dimensiuneB){

                let numeA = a.getElementsByClassName("val-nume")[0].innerHTML
                let numeB = b.getElementsByClassName("val-nume")[0].innerHTML

                return semn*numeA.localeCompare(numeB);
            }
            return semn*dimensiuneA - dimensiuneB;
        });
        
        for(let prod of produseArray){
            prod.parentNode.append(prod)
        }

    }

    document.getElementById("sortCrescNume").onclick = function (){
        sorteaza(1);
    };

    document.getElementById("sortDescrescNume").onclick = function (){
        sorteaza(-1);
    };


    document.getElementById("calcul-cost").onclick = function(e) {
            var suma = 0;
            var produse = document.getElementsByClassName("produs");
            for (let prod of produse) {
                var stil = getComputedStyle(prod);
                if (stil.display !== "none") {
                    suma += parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML);
                }
            }
            if (!document.getElementById("par_suma")) {
                let p = document.createElement("p");
                p.innerHTML = suma;
                p.id = "par_suma";
                let container = document.getElementById("produse");
                container.insertBefore(p, container.children[0]);
                setTimeout(function(){
                    var pgf = document.getElementById("par_suma")
                    if(pgf){
                        pgf.remove()
                    }
                },2000)
            }
    };
    
    
})

