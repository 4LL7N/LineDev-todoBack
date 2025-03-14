import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


export async function authMiddleware(req,res,next){
    console.log(req.url);
    console.log(req.url.startsWith("/task/") && (req.method === "PATCH" || req.method === "DELETE"));
    
    if(req.url.startsWith("/task") && (req.method === "PATCH" || req.method === "DELETE" || req.method === "POST")){        
       const headerToken = req.headers.authorization;
       if(!headerToken || !headerToken.startsWith("Bearer ")){
           res.writeHead(401, {
               "Content-Type": "application/json",
           });
           return res.end(JSON.stringify({error: "Unauthorized"}));
       }
       const token = headerToken.split(" ")[1];
       jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if(err){
            res.writeHead(401, {
                "Content-Type": "application/json",
            });
            return res.end(JSON.stringify({error: "Unauthorized"}));
        }
        req.user = decoded;
        next()
       });
    } 
    next();
}