import DriveRequestHandler from "./DriveRequestHandler.js";

export default class Drive {
    #requestHandler = new DriveRequestHandler();
    #fileId;
    constructor(fileId, refreshToken){
        this.setFileId(fileId);
        this.setRefreshToken(refreshToken);
    }
    async initialize(authorizationCode){
        await this.#requestHandler.fetchRefreshToken(authorizationCode);
        let files = await this.#requestHandler.getFiles();
        if(files.length == 0)
            await this.#createEmptyPasswordListFile();
        else
            this.setFileId(files[0].id);
    }

    async #createEmptyPasswordListFile(){
        let data = '{}';
        let requestOptions = {
            method: 'PUT',
            headers: {'Content-Type':'text/plain','Content-Length': Buffer.byteLength(data)},
            body: data,
        };
        let resumableUploadUrl = await this.#requestHandler.getUploadUrl();
        let fileResource = await this.#requestHandler.requestDriveApi(resumableUploadUrl, requestOptions);
        this.setFileId(fileResource.id);
    }

    setFileId(fileId){
        this.#fileId = fileId;
    }

    getFileId(){
        this.#checkFileId();
        return this.#fileId;
    }

    setRefreshToken(refreshToken){
        this.#requestHandler.setRefreshToken(refreshToken);
    }
    
    getRefreshToken(){
        return this.#requestHandler.getRefreshToken();
    }

    async updatePasswordList(data){
        this.#checkFileId();
        let resumableUpdateUrl = await this.#requestHandler.getUpdateUrl(this.#fileId);
        let requestOptions = {
            method: 'PUT',
            headers: {'Content-Type': 'text/plain','Content-Length': Buffer.byteLength(data)},
            body: data
        }
        await this.#requestHandler.requestDriveApi(resumableUpdateUrl, requestOptions);
    }
    
    async getPasswordList(){
        this.#checkFileId();
        return await this.#requestHandler.readFile(this.#fileId);
    }

    #checkFileId(){
        if(this.#fileId == undefined)
            throw new Error("File Id not set");
    }
    
}