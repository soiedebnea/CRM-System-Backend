import { Router } from "express";
import Contact from "../models/Contact.js";

const r = Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const find = async (id) => {
  const c = await Contact.findById(id);
  if (!c) { const e = new Error("Contact not found"); e.status = 404; throw e; }
  return c;
};
const pick = (b) => Object.fromEntries(["name", "email", "phone", "company", "tags"].filter((k) => k in b).map((k) => [k, b[k]]));

/* ---------- Contacts ---------- */
r.get("/contacts", wrap(async (req, res) => {
  const { search, tag } = req.query;
  const q = {};
  if (tag) q.tags = tag.toLowerCase();
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    q.$or = [{ name: rx }, { email: rx }, { company: rx }, { phone: rx }];
  }
  res.json(await Contact.find(q).select("-notes").sort({ name: 1 }));
}));

r.post("/contacts", wrap(async (req, res) => res.status(201).json(await Contact.create(pick(req.body)))));
r.get("/contacts/:id", wrap(async (req, res) => res.json(await find(req.params.id))));
r.put("/contacts/:id", wrap(async (req, res) => {
  const c = await find(req.params.id);
  c.set(pick(req.body));
  res.json(await c.save());
}));
r.delete("/contacts/:id", wrap(async (req, res) => {
  await (await find(req.params.id)).deleteOne();
  res.status(204).end();
}));

/* ---------- Notes ---------- */
r.post("/contacts/:id/notes", wrap(async (req, res) => {
  const c = await find(req.params.id);
  c.notes.unshift({ text: req.body.text });
  res.status(201).json(await c.save());
}));
r.delete("/contacts/:id/notes/:noteId", wrap(async (req, res) => {
  const c = await find(req.params.id);
  c.notes.pull(req.params.noteId);
  res.json(await c.save());
}));

/* ---------- Reminders ---------- */
r.post("/contacts/:id/reminders", wrap(async (req, res) => {
  const c = await find(req.params.id);
  c.reminders.push({ title: req.body.title, dueDate: req.body.dueDate });
  res.status(201).json(await c.save());
}));
r.patch("/contacts/:id/reminders/:rid", wrap(async (req, res) => {
  const c = await find(req.params.id);
  const rem = c.reminders.id(req.params.rid);
  if (!rem) return res.status(404).json({ error: "Reminder not found" });
  if ("done" in req.body) rem.done = !!req.body.done;
  if (req.body.title) rem.title = req.body.title;
  if (req.body.dueDate) rem.dueDate = req.body.dueDate;
  res.json(await c.save());
}));
r.delete("/contacts/:id/reminders/:rid", wrap(async (req, res) => {
  const c = await find(req.params.id);
  c.reminders.pull(req.params.rid);
  res.json(await c.save());
}));

// Pending reminders across all contacts, soonest first. ?within=7 limits to the next 7 days (overdue always included).
r.get("/reminders", wrap(async (req, res) => {
  const cond = { "reminders.done": false };
  if (req.query.within) cond["reminders.dueDate"] = { $lte: new Date(Date.now() + Number(req.query.within) * 864e5) };
  res.json(await Contact.aggregate([
    { $unwind: "$reminders" },
    { $match: cond },
    { $sort: { "reminders.dueDate": 1 } },
    { $project: { _id: 0, contactId: "$_id", contactName: "$name", reminderId: "$reminders._id", title: "$reminders.title", dueDate: "$reminders.dueDate" } },
  ]));
}));

/* ---------- Tags ---------- */
r.get("/tags", wrap(async (req, res) => {
  res.json(await Contact.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ]));
}));

export default r;