import mongoose, {Schema} from "mongoose";
import  jwt  from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trime: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trime: true
    },
    fullname: {
        type: String,
        required: true,
        trime: true,
        index: true
    },
    avatar: {
        type: String,
        required: true
    },
    coverimage:{
        type: String,
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: 'video'
        }
    ],
    password:{
        type: String,
        required: true
    },
    refreshToken:{
        type: String
    }

}, {timestamps: true})

userSchema.pre("save", function async (next) {
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
   return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken =  function () {
   return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        },
    )
}

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        },
        )
}

export const User = mongoose.model('User', userSchema);