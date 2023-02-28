import Drive from './driveIO.js';
import Sessions from './handleSessions.js'

export async function sendData(req,res){
    if(req.cookies.sessionexist){
        let refreshToken = await Sessions.findSession(req.cookies.sessionid);
        let data = await Drive.getData(req.cookies.sessionid,refreshToken);
        res.json(data);
    }
    else res.end();
}

export async function authorize(req,res){
    if(req.query.code){
        let userData = await Drive.init(req.query.code)
        let sessionData = {
            fileid: userData[0],
            refreshtoken: userData[1],
        };
        await Sessions.createSession(sessionData);
        res.cookie('sessionid',userData[0]);
        res.cookie('sessionexist','true');
        res.send('<script>window.close()</script>');
    }else res.end();
}

export async function sync(req,res){
    let data = req.body;
    let refreshToken = await Sessions.findSession(req.cookies.sessionid);
    let updateUrl = await Drive.generateUpdateUrl(req.cookies.sessionid,refreshToken);
    await Drive.uploadFile(updateUrl, JSON.stringify(data));
    res.json({status: 'success'});
}