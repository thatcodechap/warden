// Warning: please don't use it yet. Still in development

import {updateStringFile } from "./fileIO.js";
import { syncFile } from "./driveIO.js";
import generateRandomPassowrd from "./pigen.js";

export default class warden{
    #passwordList = {};
    #passwordFile = 'vault.json';

    #update(){
        updateStringFile(this.#passwordFile, JSON.stringify(this.#passwordList))
        .then(ps=>syncFile(this.#passwordFile))
    }

    fetch(keyword){
        if(this.#passwordList[keyword])
            return this.#passwordList[keyword]
        else return undefined;
    }

    add(keyword, password){
        this.#passwordList[keyword] = password;
        this.#update();
    }

    remove(keyword){
        if(fetch(keyword)){
            delete this.#passwordList[keyword];
            this.#update();
        }else return false;
    }

    async reset(keyword, newPassword){
        if(fetch(keyword)){
            if(newPassword)
            this.#passwordList[keyword] = newPassword;
            else
            this.#passwordList[keyword] = await generateRandomPassowrd();
            this.#update();
        }else return false;
    }

    list(){
        return this.#passwordList;
    }

}
