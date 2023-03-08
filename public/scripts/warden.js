// Warning: please don't use it yet. Still in development

export default class warden{
    #passwordList = {"sample": "password"};
    
    passwordExists(keyword){
        if(!this.#passwordList[keyword])
            return false;
        else
            return true;
    }

    get(keyword){
        if(!this.passwordExists(keyword))
            throw new Error("Password does not exist");
        return this.#passwordList[keyword];
    }

    add(keyword, password){
        if(this.passwordExists(keyword))
            throw new Error("Password already exists");
        this.#passwordList[keyword] = password;
    }

    remove(keyword){
        if(!this.passwordExists(keyword))
            throw new Error("Password does not exist");
        delete this.#passwordList[keyword];
    }

    list(){
        return this.#passwordList;
    }

    clear(){
        this.#passwordList = {};
    }

}
