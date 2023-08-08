import fetch from 'isomorphic-fetch';
export default class DriveRequestHandler{
    #passwordListFileName = 'passwordList.json';
    #baseUploadUrl = 'https://www.googleapis.com/upload/drive/v3/files/';
    #downloadUrl = 'https://www.googleapis.com/drive/v3/files/';
    #oauthUrl = 'https://oauth2.googleapis.com/token';
    #apiCredentials = {
        clientId: '350990865082-6s5s1l5t5l5eonkea8prah5m04unmo1n.apps.googleusercontent.com',
        clientSecret: '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',
        redirectUrl: 'http://localhost:8080/auth',
    }
    #refreshToken;
    #accessToken;

    async fetchRefreshToken(authorizationCode){
        let parameters = {
            client_id: this.#apiCredentials.clientId,
            client_secret: this.#apiCredentials.clientSecret,
            code: authorizationCode,
            grant_type: 'authorization_code',
            redirect_uri: this.#apiCredentials.redirectUrl
        }
        let requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: this.#createUrlSafeString(parameters)
        }
        let apiResponse = await this.requestDriveApi(this.#oauthUrl, requestOptions);
        this.#refreshToken =  apiResponse.refresh_token;
    }
    
    async #renewAccessToken(){
        if(this.#refreshToken == undefined)
            throw new Error("Refresh Token not set!");
        let parameters = {
            client_id: this.#apiCredentials.clientId,
            client_secret: this.#apiCredentials.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: this.#refreshToken
        }
        let requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: this.#createUrlSafeString(parameters)
        }
        let apiResponse = await this.requestDriveApi(this.#oauthUrl, requestOptions);
        this.#accessToken = apiResponse.access_token;
    }

    #createUrlSafeString(parameters){
        return new URLSearchParams(parameters);
    }

    async getUploadUrl(){
        await this.#renewAccessToken();
        let requestUrl = this.#baseUploadUrl + '?uploadType=resumable';
        let metadata = {
            'name': this.#passwordListFileName,
            'parents': ['appDataFolder'],
        };
        let requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': `Bearer ${this.#accessToken}`
            },
            body: JSON.stringify(metadata)
        }
        let apiResponse = await this.requestDriveApi(requestUrl, requestOptions);
        return apiResponse.headers.get('Location');
    }

    async getUpdateUrl(fileId){
        await this.#renewAccessToken();
        let requestUrl = this.#baseUploadUrl + fileId + '?uploadType=resumable';
        let requestOptions = {
            method: 'PATCH',
            headers: {'Authorization': `Bearer ${this.#accessToken}`}
        }
        let apiResponse = await this.requestDriveApi(requestUrl, requestOptions);
        return apiResponse.headers.get('Location');
    }

    async getFiles(){
        await this.#renewAccessToken();
        let requestUrl = this.#downloadUrl + '?spaces=appDataFolder';
        let requestOptions = {
            method: 'GET',
            headers: {'Authorization': `Bearer ${this.#accessToken}`}
        };
        let apiResponse = await this.requestDriveApi(requestUrl, requestOptions);
        return apiResponse.files;
    }

    async readFile(fileId){
        await this.#renewAccessToken();
        let requestUrl = this.#downloadUrl + fileId + '?alt=media'
        let requestOptions = {
            method: 'GET',
            headers: {'Authorization': `Bearer ${this.#accessToken}`}
        };
        return await this.requestDriveApi(requestUrl, requestOptions);
    }

    async requestDriveApi(url, options){
        let response = await fetch(url, options);
        let jsonData;
        try{
            jsonData = await response.json();
        }catch(err){
            return response;
        }
        if(this.#errorExists(jsonData)){
            throw new Error(this.#getErrorMessage(jsonData));
        }
        return jsonData;
    }

    setRefreshToken(refreshToken){
        this.#refreshToken = refreshToken;
    }
    getRefreshToken(){
        return this.#refreshToken;
    }
    #errorExists(jsonData){
        if(jsonData.error)
            return true;
        else
            return false;
    }
    #getErrorMessage(jsonData){
        if(jsonData.error.errors)
            return `${jsonData.error.code}: ${jsonData.error.errors[0].message}`;
        else
            return jsonData.error_description;
    }
    
}