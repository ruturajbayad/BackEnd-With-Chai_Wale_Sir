import { Router } from "express";
import { changeCurrentPassword, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAvatar, updateCoverIamge, updateUserDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { verify } from "jsonwebtoken";

const router = Router();

router.route('/register').post(
        upload.fields([
            {
                name: "avatar",
                maxCount: 1
            },
            {
               name: "coverimage",
               maxCount:1
            }
        ]),
        registerUser
    )



// * secure Routes
router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changeCurrentPassword)
router.route('/update-account').patch(verifyJWT, updateUserDetails)
router.route('/update-avatar').patch(verifyJWT, upload.single("avatar"), updateAvatar)
router.route('/update-coverimage').patch(verifyJWT, upload.single("coverimage"), updateCoverIamge)

router.route('/c/:username').get(verifyJWT, getUserChannelProfile)
router.route('/history').get(verifyJWT, getWatchHistory)

export default router