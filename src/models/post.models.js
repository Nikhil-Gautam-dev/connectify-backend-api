import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        createdby:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        title:{
            type:String,
            required:true
        },
        content:{
            type:String,
            required:true
        },
        postImgUrl:{
            type:String,
            default:""
        },
        likes:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            }
        ],
        tags:[
            {
                type:String
            }
        ]
    },
    {timestamps:true})


export const Post = mongoose.model("Post",postSchema)