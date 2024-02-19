import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    specializedIn:[{
        type:String
    }],
    phone: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

export const Hospital = mongoose.model("Hospital", hospitalSchema);