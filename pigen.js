// Warning: please don't use it yet. Still in development
import fetch from "isomorphic-fetch";
let url = "https://pigen-hvjl.onrender.com/generate";
export default async function generateRandomPassowrd(){
    return (await (await fetch(url)).json())['passwords'][0];
}