import { ObjectId } from "mongodb";
import { connect } from "../DB.js";

export async function handleRequest (req,res){
    const db = await connect();
    const taskCollection = db.collection("tasks");
    
    if (req.method === "GET" && req.url.startsWith("/tasks")) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const filter = {}
      if(url.searchParams.has("completed")){
        filter.completed = url.searchParams.get("completed") === "true";
      }
      if(url.searchParams.has("priority")){
        if(Number(url.searchParams.get("priority"))){
          filter.priority =  Number(url.searchParams.get("priority"));
        }
      }
      
      const tasks = await taskCollection.find(filter).toArray();
      
      res.writeHead(200, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify(tasks));
      } else if (req.method === "POST" && req.url === "/tasks") {
        let body = "";
        req.on("data", (data) => {            
          body += data.toString();
        });        
        req.on("end", async () => {
          const newTask = JSON.parse(body);
          if (!newTask.task) {
            throw new Error("Task is required");
          }
          newTask.userId = req.user.ID;
          const result = await taskCollection.insertOne(newTask);
          const task = await taskCollection.findOne({ _id: result.insertedId });
          res.writeHead(201, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              message: "Task created",
              task,
            })
          );
        });
      }else if (req.method === "GET" && req.url.startsWith("/task/")){
        const taskId = req.url.split("/task/")[1];
        if (!ObjectId.isValid(taskId)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid Task ID" }));
        }
        const task = await taskCollection.findOne({ _id: new ObjectId(taskId) });
        if (!task) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Task not found" }));
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(task));
      }else if (req.method === "PATCH" && req.url.startsWith("/task/")){
        const taskId = req.url.split("/task/")[1];        
        if (!ObjectId.isValid(taskId)) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Invalid Task ID" }));
          }
          const task = await taskCollection.findOne({ _id: new ObjectId(taskId) });
          
          if(task.userId !== req.user.ID){
            res.writeHead(401, {
                "Content-Type": "application/json",
              });
              res.end(JSON.stringify({ message: "Not your task" }));
          }

        let body = "";
        req.on("data", (data) => {
          body += data.toString();
        });
        req.on("end", async () => {
          const updatedTask = JSON.parse(body);
          const update = await taskCollection.updateOne(
            { _id: new ObjectId(taskId) },
            { $set: updatedTask }
          );
          
          if(update.matchedCount === 0){
            res.writeHead(404, {
                "Content-Type": "application/json",
              });
              res.end(JSON.stringify({ message: "Task not found" }));
          }else{
            const task = await taskCollection.findOne({ _id: new ObjectId(taskId) });
              res.writeHead(200, {
                "Content-Type": "application/json",
              });
              res.end(JSON.stringify(
                { 
                    message: "Task updated" ,
                    task
                }
            ));
          }
        });
      }else if (req.method === "DELETE" && req.url.startsWith("/task/")){
        const taskId = req.url.split("/task/")[1];

        
        if (!ObjectId.isValid(taskId)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid Task ID" }));
        }
        
        const task = await taskCollection.findOne({ _id: new ObjectId(taskId) });

        if(!task){
            res.writeHead(404, {
                "Content-Type": "application/json",
              });
              res.end(JSON.stringify({ message: "Task not found" }));
          }

          if(task.userId !== req.user.ID){
            res.writeHead(401, {
                "Content-Type": "application/json",
              });
              res.end(JSON.stringify({ message: "Not your task" }));
          }
          const result = await taskCollection.deleteOne({ _id: new ObjectId(taskId) });
          
          if(result.deletedCount === 0){
            res.writeHead(404, {
                "Content-Type": "application/json",
              });
            res.end(JSON.stringify({ message: "Task not found" }));
          }else{
              res.writeHead(200, {
                "Content-Type": "application/json",
              });
              res.end(JSON.stringify({ message: "Task deleted" }));
          }
        
      }else{
        res.end(JSON.stringify({ message: "Not found endpoint" }));
      }
}