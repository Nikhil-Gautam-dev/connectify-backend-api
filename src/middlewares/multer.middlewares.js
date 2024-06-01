import multer from "multer"; 


const storage = multer.diskStorage(
    {
        destination: function(req,file,cb){
            cb(null,"./public/temp")
        },
        filename:function(req,file,cb){
            const regEX = RegExp("[^a-zA-Z0-9\s.]+$")
            const filename=file.originalname.replace(regEX,"")
            cb( null, filename)
        }
    }
)

export const upload = multer({ storage: storage });

