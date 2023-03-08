import warden from './warden.js';
let ward = new warden();
let syncCount = 0;
let passwordList = document.querySelector('#passwordList');
let mainContainer = document.querySelector('.container');
const googleLoginUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=154498182121-i9vevd7if4kr77oocibtgadmqe047if6.apps.googleusercontent.com&redirect_uri=http://localhost:8080/auth&response_type=code&scope=https://www.googleapis.com/auth/drive.appdata&access_type=offline&include_granted_scopes=true';

init();
function init(){
    setClickEventListener(document.querySelector('#addButton'),add);
    if(sessionExists())
        restore();
    else{
        displayPasswords();
        let backupButton = createButton('Backup', backup);
        backupButton.id = 'backup';
        mainContainer.append(backupButton);
    }
}
function setClickEventListener(element, evenHandler){
    element.addEventListener('click',evenHandler);
}
function sessionExists(){
    if(document.cookie == '')
        return false;
    else
        return true;
}
function add(){
    let key = document.querySelector('#keyword').value;
    let password = document.querySelector('#password').value;
    if(ward.passwordExists(key)){
        alert("Keyword already exists!");
    }else{
        ward.add(key, password);
        passwordList.append(createEntry(key, password));
        sync();
    }
}
function createEntry(key, password){
    let passwordContainer = createPasswordContainer();
    passwordContainer.append(createKeywordElement(key));
    passwordContainer.append(createPasswordElement(password));
    passwordContainer.append(createButton('Edit',editEntry));
    passwordContainer.append(createButton('Delete', deleteItem));
    return passwordContainer;
}
function createPasswordContainer(){
    let element = document.createElement('p');
    element.className = 'entry';
    return element;
}
function createKeywordElement(initialValue){
    let element = createInputElement(initialValue);
    element.className = 'box';
    element.setAttribute('readonly', 'true');
    return element;
}
function createPasswordElement(initialValue){
    let element = createInputElement(initialValue);
    element.className = 'box';
    element.setAttribute('readonly', 'true');
    setClickEventListener(element, copyValuetoClipbaord);
    return element;
}
function copyValuetoClipbaord(){
    navigator.clipboard.writeText(this.value);
}
function deleteItem(){
    ward.remove(this.parentElement.querySelector('input').value);
    this.parentElement.remove();
    sync();
}
function createInputElement(initialValue){
    let element = document.createElement('input');
    element.setAttribute('value', initialValue);
    return element;
}
function createButton(buttonText, action){
    let element = document.createElement('button');
    element.innerText = buttonText;
    setClickEventListener(element,action);
    return element;
}
async function restore(){
    try{
        let passwordList = await fetchPasswordList();
        ward.clear();
        Object.keys(passwordList).forEach(key=>{
            ward.add(key, passwordList[key]);
        });
        displayPasswords();
    }catch(err){
        showFailMessage('Restore Failed!', restore);
    }
}
function displayPasswords(){
    passwordList.innerHTML = '';
    let list = ward.list();
    Object.keys(list).forEach(key=>{
        let passwordEntry = createEntry(key, list[key]);
        passwordList.append(passwordEntry);
    })
}

async function sync(){
    if(!sessionExists())
        return;
    if(!syncing()){
        showSyncMessage();
    }
    syncCount++;
    try{
        await sendData(ward.list());
        syncCount--;
        if(syncCount == 0)
            hideSyncMessage();
    }catch(err){
        syncCount--;
        hideSyncMessage();
        showFailMessage("Sync Failed!", sync);
    }
}

async function sendData(jsonData){
    let response = await fetch('/sync',{
        method: 'POST',
        headers:{'Content-Type': 'application/json'},
        body: JSON.stringify(jsonData),
    });
    let jsonStatus = await response.json();
    if(jsonStatus.status == 'failed')
        throw new Error("Failed to sync!");
    return jsonStatus.status;
}
function syncing(){
    if(syncCount == 0)
        return false;
    else
        return true;
}
function showFailMessage(message, action){
    let failMessage = createParagraph(message);
    let tryAgainButton = createButton('Try Again',action);
    failMessage.append(tryAgainButton);
    mainContainer.append(failMessage);
}
function showSyncMessage(){
    let syncMessage = createParagraph('Syncing...');
    syncMessage.id = 'sync';
    mainContainer.append(syncMessage);
}
function hideSyncMessage(){
    document.querySelector('#sync').remove();
}
function createParagraph(text){
    let element = document.createElement('p');
    element.innerText = text;
    return element;
}

async function backup(){
    let loginWindow = window.open(googleLoginUrl,'__blank','popup,width=500,height=600');
    await waitForWindowClose(loginWindow);
    hideBackupButton();
    if(!sessionExists()){
        showFailMessage('Backup Failed!', backup);
        return;
    }
    if(!wantsToRestore()){
        sync();
        return;
    }
    restore();
}
async function waitForWindowClose(window){
    while(true){
        if(window.closed)
            break;
        await wait(1000);
    }
}
function wait(ms){return new Promise(res=>{setTimeout(res,ms)})}
function wantsToRestore(){
    return window.confirm("Do you want to restore from previous backup ? (You'll lose present data)");
}
async function fetchPasswordList(){
    let response = await fetch('/fetch');
    let jsonData = await response.json();
    if(jsonData.error)
        throw new Error(jsonData.error);
    return jsonData;
}
function hideBackupButton(){
    document.querySelector('#backup').remove();
}

function editEntry(){
    let inputs = this.parentElement.querySelectorAll('input');
    let command = this.innerText;
    if(command == 'Edit'){
        disableReadOnly(inputs);
        inputs.item(1).select();
        this.innerText = "Done";
        ward.remove(inputs.item(0).value);
    }else{
        enableReadOnly(inputs);
        this.innerText = "Edit";
        ward.add(inputs.item(0).value,inputs.item(1).value);
        sync();
    }
}
function enableReadOnly(elementList){
    elementList.forEach(element=>{
        element.setAttribute('readonly', 'true');
    })
}
function disableReadOnly(elementList){
    elementList.forEach(element=>{
        element.removeAttribute('readonly');
    })
}