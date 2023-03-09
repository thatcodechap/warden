import Drive from './Drive.js'
function sessionExists(req){
    if(req.cookies.sessionId)
        return true;
    else
        return false;
}
export async function sendPasswordList(req,res){
    if(sessionExists(req)){
        let sessionId = req.cookies.sessionId;
        let refreshToken = req.cookies.refreshToken;
        try {
            let drive = new Drive(sessionId, refreshToken);
            let passwordList = await drive.getPasswordList();
            res.json(passwordList);
        }catch(error){
            res.json({error: error.message});
            console.log(error);
        }
    }
    else res.end();
}

export async function authorize(req,res){
    if(req.query.code){
        try{
            let drive = new Drive();
            await drive.initialize(req.query.code);
            let sessionId = drive.getFileId();
            let refreshToken = drive.getRefreshToken();
            res.cookie('sessionId',sessionId,{httpOnly: true, maxAge: 1296000000,sameSite: 'Strict'});
            res.cookie('refreshToken',refreshToken,{httpOnly: true, maxAge: 1296000000,sameSite: 'Strict'});
            res.cookie('sessionExist','true');
        }catch(error){
            console.log("Failed to initialize drive: "+error);
        }
        res.send('<script>window.close()</script>');
    }else res.end();
}

export async function sync(req,res){
    if(sessionExists(req)){
        let sessionId = req.cookies.sessionId;
        let refreshToken = req.cookies.refreshToken;
        try{
            let drive = new Drive(sessionId, refreshToken);
            await drive.updatePasswordList(JSON.stringify(req.body));
            res.json({status: "success"});
        }catch(error){
            res.json({status: "failed"});
            console.log(error);
        }
    }else res.end();
}