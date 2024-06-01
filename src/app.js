import Express  from "express";
import cors from "cors"; 
import cookieParser from "cookie-parser";

// create an instance of express app; 
const app=Express(); 

// some important configurations; 
// cors to allow only particular frontend; 
app.use(cors({
    origin:process.env.CORS_ORIGIN, 
    credentials:true,
}))

// .json to specify that we accept all json also; 
app.use(Express.json({
    limit:"16kb"
}))

// all data from url parameters 
app.use(Express.urlencoded({
    extended:true // to allow nested objects also; 
}))

// to store data on server for short period of time or before on uploading on third party server; 
app.use(Express.static("public")); 

// to perform crud operations sefely; 
app.use(cookieParser())



// import router 
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";

//routes declaration; 

app.get("/api/test",(_,res)=>{
    res.json({
        "message":"working"
    })
})

app.use("/api/v1/users",userRouter); 

app.use("/api/v1/posts",postRouter)



export default app; 
