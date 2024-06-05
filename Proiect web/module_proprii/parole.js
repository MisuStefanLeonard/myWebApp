
sirAlphaNum="";
v_intervale=[[48,57],[65,90],[97,122]]
for(let interval of v_intervale){
    for(let i=interval[0]; i<=interval[1]; i++)
        sirAlphaNum+=String.fromCharCode(i)
}

console.log(sirAlphaNum);

function genereazaToken1(n){
    let token1=""
    for (let i=0;i<n; i++){
        token1+=Math.floor(Math.random() * n);
    }
    return token1;
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOP';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
}

function genereazaToken2(n){
    let token2=generateRandomString(n)
    return token2;
}

module.exports.genereazaToken1=genereazaToken1;
module.exports.genereazaToken2=genereazaToken2;
