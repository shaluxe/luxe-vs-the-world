import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1. Connect to Supabase
const supabaseUrl = "https://YOUR-PROJECT-REF.supabase.co";  // replace with your project ref
const supabaseKey = "YOUR_PUBLIC_ANON_KEY";                  // from Supabase settings
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. DOM references
const form = document.getElementById("comment-form");
const commentsDiv = document.getElementById("comments");

// 3. Load comments when page opens
async function loadComments() {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading comments:", error);
    return;
  }

  commentsDiv.innerHTML = ""; // clear first
  data.forEach(c => {
    const el = document.createElement("div");
    el.classList.add("comment");
    el.innerHTML = `
      <p><strong>${c.name ? c.name : "Anonymous"}</strong></p>
      <p>${c.message}</p>
      <small>${new Date(c.created_at).toLocaleString()}</small>
    `;
    commentsDiv.appendChild(el);
  });
}

// 4. Handle form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!message) return;

  const { error } = await supabase.from("comments").insert([{ name, message }]);

  if (error) {
    alert("Error posting comment!");
    console.error(error);
  } else {
    form.reset();
    loadComments(); // refresh list
  }
});

// 5. Initial load
loadComments();

// 6. Optional: Live updates (realtime)
supabase
  .channel("comments-channel")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "comments" },
    (payload) => {
      const c = payload.new;
      const el = document.createElement("div");
      el.classList.add("comment");
      el.innerHTML = `
        <p><strong>${c.name ? c.name : "Anonymous"}</strong></p>
        <p>${c.message}</p>
        <small>${new Date(c.created_at).toLocaleString()}</small>
      `;
      commentsDiv.prepend(el);
    }
  )
  .subscribe();
