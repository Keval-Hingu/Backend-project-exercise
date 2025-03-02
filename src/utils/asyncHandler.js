const asyncHandler = (reqestHandler) => {

    (req,res,next) => {
        Promise.resolve(reqestHandler(req,res,next)).catch((err) => {
            next(err);
        })
    }




}



export {asyncHandler}

// const asyncHandler = (fn) => async (req,res,next) => {

//     try
//     {
//         await fn(re1,res, next)
//     }
//     catch(err)
//     {
//         res.status(err.code || 500).json({
//             success  : false,
//             message : err.message
//         })
//     }

// }


