import warden from './warden.js';
let ward = new warden();
init();
let syncCount = 0;

async function init(){
    document.querySelector('#addButton').addEventListener('click', ()=>{
        let key = document.querySelector('#keyword');
        let password = document.querySelector('#password');
        addItem(key.value, password.value);
        reset([key,password]);
    });
    if(document.cookie != ''){
        ward.clear();
        let data = await (await fetch('/fetch')).json();
        ward.batchAdd(data);
    }else if(localStorage.length != 0){
        for(let i=0;i<localStorage.length;i++){
            ward.add(localStorage.key(i),localStorage.getItem(localStorage.key(i)));
        }
    }

    let list = ward.list();
    Object.keys(list).forEach((key)=>{
        addItem(key,list[key],true);
    })
    if(document.cookie == ''){
        let backupButton = createElementfromText('<button>Back up</button>',{id:'backup'},backup);
        document.querySelector('div').append(backupButton);
    }
}

async function sync(){
    if(document.cookie == ''){
        localStorage.clear();
        Object.keys(ward.list()).forEach(key=>{
            localStorage.setItem(key,ward.get(key));
        })
        return;
    }
    syncCount++;
    if(!document.querySelector('#sync'))
        document.querySelector('div').append(createElementfromText('<p id="sync">Syncing...</p>'));
    let resp = await fetch('/sync',{
        method: 'POST',
        headers:{'Content-Type': 'application/json'},
        body: JSON.stringify(ward.list())
    })
    let stat = await resp.json();
    syncCount--;
    if(stat.status == 'success'){
        if(syncCount <= 0)
            document.querySelector('#sync').remove();
    }
    else{
        document.querySelector('#sync').innerHTML = 'Sync failed <button onclick=sync()>Try again</button>';
    }
}

function wait(ms){return new Promise(res=>{setTimeout(res,ms)})}

async function backup(){
    let loginWindow = window.open('https://accounts.google.com/o/oauth2/v2/auth?client_id=154498182121-i9vevd7if4kr77oocibtgadmqe047if6.apps.googleusercontent.com&redirect_uri=http://localhost:8080/auth&response_type=code&scope=https://www.googleapis.com/auth/drive.appdata&access_type=offline&include_granted_scopes=true','__blank','popup,width=500,height=600');
    while(true){
        if(loginWindow.closed){
            console.log("Window closed!");
            break;
        }
        await wait(1000);
    }
    if(document.cookie != ''){
        document.querySelector('#backup').remove();
        if(window.confirm("Do you want to restore from previous backup ? (You'll lose present data)")){
            ward.clear();
            let data = await (await fetch('/fetch')).json();
            ward.batchAdd(data);
            document.querySelector('#passwordList').innerHTML = "";
            let list = ward.list();
            Object.keys(list).forEach((key)=>{
                addItem(key,list[key],true);
            })
        }else{
            sync();
        }
    }
}

function createElementfromText(html,attrList,eventFunction){
    let template = document.createElement('template');
    template.innerHTML = html.trim();
    let element =  template.content.firstElementChild;
    if(attrList){
        Object.keys(attrList).forEach((key)=>{
            element.setAttribute(key, attrList[key]);
        })
    }
    if(eventFunction){
        element.addEventListener('click',eventFunction);
    }
    return element;
}
function reset(list){
    list.forEach(element => {
        element.value = "";
    });
}

function copyTexttoClipbaord(){
    navigator.clipboard.writeText(this.value);
}

function edit(){
    let inputs = this.parentElement.querySelectorAll('input');
    if(this.innerText == "Edit"){
        inputs.forEach((element)=>element.removeAttribute('readonly'));
        inputs.item(1).select();
        this.innerText = "Done";
        ward.remove(inputs.item(0).value);
    }else{
        inputs.forEach(element=>element.setAttribute('readonly',""));
        this.innerText = "Edit";
        ward.add(inputs.item(0).value,inputs.item(1).value);
        sync();
    }
}

function deleteItem(){
    ward.remove(this.parentElement.querySelector('input').value);
    this.parentElement.remove();
    sync();
}

function presentAlert(){
    alert("Element already present");
}

async function randomize(){
    let inputs = this.parentElement.querySelectorAll('input');
    inputs.item(1).value = await ward.reset(inputs.item(0).value);
    sync();
};

function addItem(key, password,init){
    if((ward.get(key) && !init) || key == ""){
        presentAlert();
        return;
    }
    ward.add(key, password);
    let p = createElementfromText(`<p></p>`,{class: 'entry'});
    p.append(createElementfromText('<input>',{class:'box',value: key,readonly:''}));
    p.append(createElementfromText('<input>',{class:'box',value: password,readonly:''},copyTexttoClipbaord));
    p.append(createElementfromText('<button>Edit</button>',null,edit));
    p.append(createElementfromText('<button>Delete</button>',null,deleteItem));
    p.append(createElementfromText('<button>Randomize</button>',null,randomize));
    document.querySelector('#passwordList').append(p);
    if(!init)
        sync();
}