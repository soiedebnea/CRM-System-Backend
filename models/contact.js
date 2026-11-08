import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({ text: { type: String, required: true, trim: true } }, { timestamps: true });

const reminderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    tags: { type: [String], default: [], set: (v) => [...new Set(v.map((t) => t.trim().toLowerCase()).filter(Boolean))] },
    notes: [noteSchema],
    reminders: [reminderSchema],
  },
  { timestamps: true }
);

contactSchema.index({ name: 1 });
contactSchema.index({ tags: 1 });
contactSchema.index({ "reminders.dueDate": 1 });

export default mongoose.model("Contact", contactSchema);