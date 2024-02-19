import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    qualification: {
        type: String,
        required: true
    },
    experianceinyear: {
        type: Number,
        defaul: 0
    },
    worksinhospitals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital"
    }]
});

export const Doctor = mongoose.model("Doctor", doctorSchema);