import http from 'http';
import { handleRequest } from '../lineDev/routes/tasks.js';
import { connect } from '../lineDev/DB.js';
import { handleAuth } from '../lineDev/routes/auth.js';
import { authMiddleware } from './middleware/authMid.js';

await connect()
const app = http.createServer((req,res)=>{
    if(req.url.startsWith("/auth")){
        handleAuth(req,res);
    }else if(req.url.startsWith("/task")){
        authMiddleware(req,res,()=>{handleRequest(req,res)});
    }else{
        res.writeHead(404, {
            "Content-Type": "application/json",
          });
          res.end(JSON.stringify({ error: "Route not found" }));
    }
})
app.listen(3000, () => {
    console.log('Server started on port 3000');
});

