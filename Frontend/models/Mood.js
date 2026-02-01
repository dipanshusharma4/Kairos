import mongoose from 'mongoose';

const MoodSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    mood: {
        type: String, // e.g., 'Happy', 'Sad', 'Neutral', or the emoji itself
        required: true,
    },
    note: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Mood || mongoose.model('Mood', MoodSchema);
