import fs from 'node:fs/promises';

class session {
    #sessions = {};
    #sessionsFile = 'sessions.json';

    async readSessions(){
        let jsonString;
        jsonString = await fs.readFile(this.#sessionsFile, {encoding: 'utf8'});
        let jsonObject = JSON.parse(jsonString);
        this.#sessions = jsonObject;
    }

    async writeSessions(){
        await fs.writeFile(this.#sessionsFile, JSON.stringify(this.#sessions));
    }

    async findSession(sessionId){
        await this.readSessions();
        return this.#sessions[sessionId];
    }

    async createSession(data){
        await this.readSessions();
        let found;
        Object.keys(this.#sessions).forEach(id=>{
            if(id == data.fileid){
                found = id;
                return;
            }
        })
        if(found)
            return found;
        this.#sessions[data.fileid] = data.refreshtoken;
        await this.writeSessions();
        return data.fileid;
    }
}

let Sessions = new session();
export default Sessions;