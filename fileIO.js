// Warning: please don't use it yet. Still in development
import fs from 'node:fs/promises'

export async function getFileBuffer(fileName){
    let fileHandle;
    try {
        fileHandle = await fs.open(fileName, 'r+');
    }catch(err){
        fileHandle = await fs.open(fileName, 'w+');
    }
    let buffer = fileHandle.readFile();
    fileHandle.close();
    return buffer;
}

export async function readJsonFile(fileName){
    let fileHandle;
    try {
        fileHandle = await fs.open(fileName, 'r+');
    }catch(err){
        fileHandle = await fs.open(fileName, 'w+');
    }
    let jsonString = await fileHandle.readFile({encoding:'utf8'});
    return JSON.parse(jsonString);
}

export async function updateStringFile(fileName, data){
    let fileHandle = await fs.open(fileName, 'w+');
    await fileHandle.writeFile(data, {encoding: 'utf8'});
    await fileHandle.close();
}