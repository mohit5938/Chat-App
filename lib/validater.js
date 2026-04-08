import { body , validationResult , check, param ,query} from 'express-validator'




export const registerValidater = () => [
    // Name validation
    body("name")
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3 })
        .withMessage("Name must be at least 3 characters"),

    body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .isLength({ min: 3 })
        .withMessage("Username must be at least 3 characters"),

    body("email")
         .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),

    body("password")
          .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/)
        .withMessage("Password must contain one uppercase letter")
        .matches(/[a-z]/)
        .withMessage("Password must contain one lowercase letter")
        .matches(/[0-9]/)
        .withMessage("Password must contain one number")
        .matches(/[@$!%*?&]/)
        .withMessage("Password must contain one special character"),


    body("bio")
        .optional()
        .isLength({ max: 200 })
        .withMessage("Bio must be less than 200 characters"),

   
];

export const loginValidater = () =>  [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/)
        .withMessage("Password must contain one uppercase letter")
        .matches(/[a-z]/)
        .withMessage("Password must contain one lowercase letter")
        .matches(/[0-9]/)
        .withMessage("Password must contain one number")
        .matches(/[@$!%*?&]/)
        .withMessage("Password must contain one special character"),

]

export const newGroupChatValidater = () => [
    body("name")
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3 })
        .withMessage("Name must be at least 3 characters"),



]

export const sendReqValidator = () => [
    body("userId")
        .notEmpty()
        .withMessage("userId is required")
]

export const reqValidator = () => [
    body("reqId")
        .notEmpty()
        .withMessage("ReqId is required"),

        body("accept")
        .notEmpty()
        .withMessage("please add Accept")
        .isBoolean()
        .withMessage("accept must be boolean")
]

export const addMemberValidater = () => [
    body("chatId")
        .notEmpty()
        .withMessage("chatId is required"),

    body("members") 
       
        .isArray({ min: 1, max: 97 })
        .withMessage("Members must be 1-97"),
];

export const removeMemberHandler = () =>[
    body("userId")
        .notEmpty()
        .withMessage("userId can't be empty"),
        body("chatId")
            .notEmpty()
        .withMessage("chatId can't be empty")
]

export const leaveGroupValidator = () =>[
    param("id")
        .notEmpty()
        .withMessage("please enter chatId"),
]

export const sendAttachmentValidater = () => [
    body("chatId")
        .notEmpty()
        .withMessage("chatId is required")
    ,
    
    
]

export const getMessageValidater = () => [
    param("id")
    .notEmpty()
    .withMessage("Please enter chat id ")
]
export const chatIdValidater = () => [
    param("id")
        .notEmpty()
        .withMessage("Please enter chat id ")
]
export const renameGroupValidater = () => [
    param("id")
        .notEmpty()
        .withMessage("Please enter chat id ") ,
        body("name")
        .notEmpty()
        .withMessage("please enter name")
]


export const adminValidator = () => [
    body("secretKey")
        .notEmpty()
        .withMessage("secretKey can't be empty"),
]


export const validateHandler = (req , res , next ) =>{
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    return res.status(400).json({
        success: false,
        message: "input validation error" ,
        error: errors.array()
        
    });
}