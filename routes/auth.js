import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connect } from "../DB.js";
import dotenv from "dotenv";
dotenv.config();

export async function handleAuth(req, res) {
    const db = await connect();
    const userCollection = db.collection("users");
    if(req.method === "POST" && req.url === "/signup"){
        let body = "";
        req.on("data", (data) => {
            body += data.toString();
        });
        req.on("end", async () => {
            const newUser = JSON.parse(body)
            console.log(newUser);
            ;
            if(!newUser.email || !newUser.password){
                res.writeHead(400, {
                    "Content-Type": "application/json",
                });
                return res.end(JSON.stringify({error: "Email and password are required"}));
            }
            const user = await userCollection.findOne({email: newUser.email});
            if(user){
                res.writeHead(400, {
                    "Content-Type": "application/json",
                });
                return res.end(JSON.stringify({error: "Email already exists"}));
            }
            const password = await bcrypt.hash(newUser.password, 10);
            const result = await userCollection.insertOne({
                email: newUser.email,
                password,
            });
            res.writeHead(201, {
                "Content-Type": "application/json",
            });
            res.end(JSON.stringify({message: "User created, please login"}));
        });
    } else if(req.method === "POST" && req.url === "/login"){
        let body = "";
        req.on("data", (data) => {
            body += data.toString();
        });
        req.on("end", async () => {
            const {email, password} = JSON.parse(body);
            const user = await userCollection.findOne({email});
            const ID = user._id.toHexString();
            
            if(!user){
                res.writeHead(400, {
                    "Content-Type": "application/json",
                });
                return res.end(JSON.stringify({error: "Invalid email or password"}));
            }
            const isValid = await bcrypt.compare(password, user.password);
            if(!isValid){
                res.writeHead(400, {
                    "Content-Type": "application/json",
                });
                return res.end(JSON.stringify({error: "Invalid email or password"}));
            }
            const token = jwt.sign({ID}, process.env.JWT_SECRET, {expiresIn: "1h"});
            res.writeHead(200, {
                "Content-Type": "application/json",
            });
            res.end(JSON.stringify({message: "Login successful",token}));
        });
    }

}