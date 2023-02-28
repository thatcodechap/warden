/*
This source assumes that the user has enabled Drive API in their cloud project
and stored all the required credentials in respective fields of secrets.json file.
Refer Oauth2 and Drive API docs for detailed process:
Oauth2 Protocol: https://developers.google.com/identity/protocols/oauth2
Drive API docs: https://developers.google.com/drive/api/guides/about-sdk
*/
// Warning: please don't use it yet. Still in development

import fetch from 'isomorphic-fetch';

class drive {
    #uploadURL = 'https://www.googleapis.com/upload/drive/v3/files/';
    #downloadURL = 'https://www.googleapis.com/drive/v3/files/'
    #secrets = {
        'google_client_id': '154498182121-i9vevd7if4kr77oocibtgadmqe047if6.apps.googleusercontent.com',
        'google_client_secret': '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',
        'redirect_uri': 'http://localhost:8080/auth',
        'filename': 'passwords.json',
    };
    
    async getRefreshToken(authCode){
        let endpoint = 'https://oauth2.googleapis.com/token';
        let response = await fetch(endpoint, {
            method: 'POST',
            headers:{'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                'client_id': this.#secrets.google_client_id,
                'client_secret': this.#secrets.google_client_secret,
                'code': authCode,
                'grant_type': 'authorization_code',
                'redirect_uri': this.#secrets.redirect_uri
            })
        })
        return (await response.json())['refresh_token'];
    }
    async refreshAccessToken(refreshToken){
        let endpoint = 'https://oauth2.googleapis.com/token';
        let response = await fetch(endpoint,{
            method: 'POST',
            headers:{'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                'client_id': this.#secrets.google_client_id,
                'client_secret': this.#secrets.google_client_secret,
                'grant_type': 'refresh_token',
                'refresh_token': refreshToken,
            })
        });
        return (await response.json())['access_token'];
    }
    
    async generateUploadUrl(accessToken){
        let url = this.#uploadURL + '?uploadType=resumable';
        let metadata = {
            'name': this.#secrets.filename,
            'parents': ['appDataFolder'],
        };
        let response = await fetch(url,{
            method: 'POST',
            headers:{
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': `Bearer ${accessToken}`,
            },
            body:  JSON.stringify(metadata)
        })
        let location;
        response.headers.forEach((val,key)=>{if(key == 'location'){location = val}});
        return location;
    }
    
    async generateUpdateUrl(fileID,refresh_token){
        let url = this.#uploadURL + fileID + '?uploadType=resumable';
        let response = await fetch(url, {
            method: 'PATCH',
            headers: {'Authorization': `Bearer ${await this.refreshAccessToken(refresh_token)}`},
        })
        let location;
        response.headers.forEach((val,key)=>{if(key == 'location'){location = val}});
        return location;
    }
    
    async uploadFile(resumableUrl,data){
        let response = await fetch(resumableUrl,{
            method: 'PUT',
            headers: {'Content-Type':'text/plain','Content-Length': data.length},
            body: data,
        })
        return (await response.json())['id'];
    }
    
    async getData(fileID,refresh_token){
        let url = this.#downloadURL + fileID + '?alt=media'
        let response = await fetch(url, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${await this.refreshAccessToken(refresh_token)}`}
        })
        return await response.json();
    }

    async list(refresh_token){
        let url = this.#downloadURL + '?spaces=appDataFolder';
        let response = await fetch(url, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${await this.refreshAccessToken(refresh_token)}`}
        })
        return await response.json();
    }

    async init(authCode){
        let refreshtoken = await this.getRefreshToken(authCode);
        let filesdata = (await this.list(refreshtoken)).files;
        if(filesdata.length == 0){
            let authToken = await this.refreshAccessToken(refreshtoken);
            let url = await this.generateUploadUrl(authToken);
            let fileid = await this.uploadFile(url,'{}');
            return [fileid,refreshtoken];
        }
        return [filesdata[0].id,refreshtoken];
    }
}

const Drive = new drive();
export default Drive;