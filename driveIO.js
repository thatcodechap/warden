/*
This source assumes that the user has enabled Drive API in their cloud project
and stored all the required credentials in respective fields of secrets.json file.
Refer Oauth2 and Drive API docs for detailed process:
Oauth2 Protocol: https://developers.google.com/identity/protocols/oauth2
Drive API docs: https://developers.google.com/drive/api/guides/about-sdk
*/
// Warning: please don't use it yet. Still in development

import fetch from 'isomorphic-fetch';
import {getFileBuffer,readJsonFile} from './fileIO.js';

let uploadURL = 'https://www.googleapis.com/upload/drive/v3/files/';
let downloadURL = 'https://www.googleapis.com/drive/v3/files/'
let secrets;

async function fetchSecrets(){
    secrets = await readJsonFile('secrets.json');
}

async function refreshAccessToken(){
    await fetchSecrets();
    let endpoint = 'https://oauth2.googleapis.com/token';
    let response = await fetch(endpoint,{
        method: 'POST',
        headers:{'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
            'client_id': secrets.google_client_id,
            'client_secret': secrets.google_client_secret,
            'grant_type': 'refresh_token',
            'refresh_token': secrets.refresh_token,
        })
    });
    return (await response.json())['access_token'];
}

async function generateUploadUrl(fileName){
    let url = uploadURL + '?uploadType=resumable';
    let metadata = {
        'name': fileName,
        'parents': ['appDataFolder'],
    };
    let response = await fetch(url,{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': `Bearer ${await refreshAccessToken()}`,
        },
        body:  JSON.stringify(metadata)
    })
    let location;
    response.headers['Location'];
    return location;
}

async function generateUpdateUrl(fileID){
    let url = uploadURL + fileID + '?uploadType=resumable';
    let response = await fetch(url, {
        method: 'PATCH',
        headers: {'Authorization': `Bearer ${await refreshAccessToken()}`},
    })
    let location;
    response.headers.forEach((val,key)=>{if(key == 'location'){location = val}});
    return location;
}

async function uploadFile(fileName,resumableUrl){
    let data = await getFileBuffer(fileName);
    let response = await fetch(resumableUrl,{
        method: 'PUT',
        headers: {'Content-Length': data.length},
        body: buffer,
    })
    return await response.arrayBuffer();
}

async function createFile(fileName){
    let resumableUrl = await generateUploadUrl(fileName);
    let response = await uploadFile(fileName, resumableUrl);
    return response;
}

async function downloadFile(fileID){
    let url = downloadURL + fileID + '?alt=media'
    let response = await fetch(url, {
        method: 'GET',
        headers: {'Authorization': `Bearer ${await refreshAccessToken()}`}
    })
    return Buffer.from(await response.arrayBuffer());
}

export async function syncFile(filename){
    let resumableUrl = await generateUpdateUrl(secrets['vault_id']);
    let response = await uploadFile(filename, resumableUrl);
    return response;
}