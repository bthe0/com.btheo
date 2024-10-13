"use client";
import { useState } from "react";

export default function Guestbook() {
  const [entries, setEntries] = useState([
    { name: "John Doe", message: "Great website!", date: "2023-04-01" },
    { name: "Jane Smith", message: "Love the content!", date: "2023-04-02" },
  ]);

  const [newEntry, setNewEntry] = useState({ name: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEntries([
      ...entries,
      { ...newEntry, date: new Date().toISOString().split("T")[0] },
    ]);
    setNewEntry({ name: "", message: "" });
  };

  return (
    <div className="guestbook">
      <h3>Guestbook</h3>
      <p>
        I'd love to hear from you! Leave your thoughts, feedback, or just say
        hello — let’s stay connected and keep the conversation going!
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={newEntry.name}
          onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
          required
        />
        <textarea
          placeholder="Message"
          value={newEntry.message}
          onChange={(e) =>
            setNewEntry({ ...newEntry, message: e.target.value })
          }
          required
        ></textarea>
        <button type="submit">Sign Guestbook</button>
      </form>
      <div className="entries">
        {entries.map((entry, index) => (
          <div key={index} className="entry">
            <p>
              <strong>{entry.name}</strong> on {entry.date}
            </p>
            <p>{entry.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
