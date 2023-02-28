// Warning: please don't use it yet. Still in development
let url = "https://pigen-ez2j.onrender.com/generate";
export default async function generateRandomPassowrd(){
    return (await (await fetch(url)).json())['passwords'][0];
}