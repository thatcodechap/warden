// Warning: please don't use it yet. Still in development
import generateRandomPassowrd from "./pigen.js";

export default class warden{
    #passwordList = {"sample": "password"};

    get(keyword){
        if(this.#passwordList[keyword])
            return this.#passwordList[keyword]
        else return undefined;
    }

    add(keyword, password){
        this.#passwordList[keyword] = password;
    }

    batchAdd(object){
        Object.keys(object).forEach(key=>{
            this.add(key, object[key]);
        })
    }

    remove(keyword){
        if(this.get(keyword)){
            delete this.#passwordList[keyword];
        }else return false;
    }

    async reset(keyword, newPassword){
        if(this.get(keyword)){
            if(newPassword)
            this.#passwordList[keyword] = newPassword;
            else{
                let pass = await generateRandomPassowrd();
                this.#passwordList[keyword] = pass;
                return pass
            }
        }else return false;
    }

    list(){
        return this.#passwordList;
    }

    clear(){
        this.#passwordList = {};
    }

}
