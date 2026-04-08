import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});



// now form-data is extracted and contvert into req.file and it buffer data which is in binary form 


const singleAvatar = upload.single("avatar"); // this give req.file
const attachmentsMulter = upload.array("attachments",5); // this give req.files

export { singleAvatar, attachmentsMulter };
