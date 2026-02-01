import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String, // e.g., 'Sleep', 'Meditation', 'Walk', 'Breathing'
        required: true,
    },
    duration: {
        type: Number, // in minutes (for sleep, it could be minutes total)
        required: true,
        min: 0,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
