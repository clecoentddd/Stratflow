"use client";
import { AdminAddUserForm } from "./ui/AdminAddUserForm";

export default function AddUserPage() {
  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Add User</h1>
  <AdminAddUserForm onSubmit={() => { /* TODO: implement submit logic */ }} />
    </div>
  );
}
