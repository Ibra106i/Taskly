// Live IDOR test — creates throwaway Clerk users, generates API keys,
// probes the live MCP endpoint, then cleans up.
// Run: node --experimental-vm-modules scripts/idor-test.mjs

const CLERK_SECRET_KEY = "sk_test_SlkJKsNXCzq9hcb3vyeqFSFoCfMkNaNCYeKbZESEIy";
const SUPABASE_URL = "https://lkbqhdsyxoiqmgfffxzq.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrYnFoZHN5eG9pcW1nZmZmeHpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk5MTY4NiwiZXhwIjoyMTAzNTY3Njg2fQ.VrE_I_4sLPwqTWGlcMu7GDwlaItIqTofMxGI7KkQOrI";
const MCP_URL = "https://taskmax.vercel.app/api/mcp";

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function supabaseQuery(table, params = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await fetch(url, { headers: supabaseHeaders() });
  if (!res.ok) throw new Error(`Supabase ${table} query failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabaseInsert(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${table} insert failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabaseDelete(table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: supabaseHeaders(),
  });
  if (!res.ok) throw new Error(`Supabase ${table} delete failed: ${res.status} ${await res.text()}`);
}

async function hashKey(key) {
  const { createHmac } = await import("crypto");
  const hmac = createHmac("sha256", SUPABASE_SERVICE_KEY);
  hmac.update(key, "utf8");
  return hmac.digest("hex");
}

// --- Step 1: Create two Clerk test users ---
console.log("=== Step 1: Creating Clerk test users ===");

const timestamp = Date.now();
const userA_email = `idor-test-a+${timestamp}@test.example.com`;
const userB_email = `idor-test-b+${timestamp}@test.example.com`;

async function createClerkUser(email) {
  const res = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [email],
      skip_password_requirement: true,
      skip_password_checks: true,
    }),
  });
  if (!res.ok) throw new Error(`Clerk create user failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const clerkUserA = await createClerkUser(userA_email);
const clerkUserB = await createClerkUser(userB_email);
const userIdA = clerkUserA.id;
const userIdB = clerkUserB.id;

console.log(`  User A: ${userA_email} → ${userIdA}`);
console.log(`  User B: ${userB_email} → ${userIdB}`);

// --- Step 2: Create a todo for User B ---
console.log("\n=== Step 2: Creating todo for User B ===");

const todos = await supabaseInsert("todos", {
  user_id: userIdB,
  title: "SECRET-USER-B-DO-NOT-LEAK",
  completed: false,
  priority: null,
  position: 0,
});
const userBTodoId = todos[0].id;
console.log(`  Todo ID: ${userBTodoId}`);

// --- Step 3: Generate API keys ---
console.log("\n=== Step 3: Generating API keys ===");

const keyA_raw = `tk_test_a_${timestamp}_${Math.random().toString(36).slice(2)}`;
const keyB_raw = `tk_test_b_${timestamp}_${Math.random().toString(36).slice(2)}`;

const keyA_hash = await hashKey(keyA_raw);
const keyB_hash = await hashKey(keyB_raw);

await supabaseInsert("api_keys", [
  { user_id: userIdA, key_hash: keyA_hash, prefix: keyA_raw.slice(0, 8) },
  { user_id: userIdB, key_hash: keyB_hash, prefix: keyB_raw.slice(0, 8) },
]);

console.log(`  User A key: ${keyA_raw}`);
console.log(`  User B key: ${keyB_raw}`);

// --- Step 4: Probe MCP endpoint ---
console.log("\n=== Step 4: Live IDOR probe ===\n");

async function mcpCall(apiKey, toolName, args = {}) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  });
  return res.json();
}

let passed = 0;
let failed = 0;

// Test 1: get_todo with User A's key against User B's todo
console.log("TEST 1: get_todo (User A → User B's todo)");
const getResult = await mcpCall(keyA_raw, "get_todo", { id: userBTodoId });
const getText = getResult?.result?.content?.[0]?.text || "";
const leaked1 = getText.includes("SECRET-USER-B-DO-NOT-LEAK");
if (leaked1) {
  console.log(`  ❌ FAIL — leaked data: ${getText.slice(0, 200)}`);
  failed++;
} else {
  console.log(`  ✓ PASS — no leak (${getText.slice(0, 80)})`);
  passed++;
}

// Test 2: list_todos — User B's todo should not appear
console.log("\nTEST 2: list_todos (User A listing — User B's todo absent)");
const listResult = await mcpCall(keyA_raw, "list_todos", {});
const listText = JSON.stringify(listResult);
const leaked2 = listText.includes("SECRET-USER-B-DO-NOT-LEAK") || listText.includes(userBTodoId);
if (leaked2) {
  console.log(`  ❌ FAIL — leaked in list`);
  failed++;
} else {
  console.log(`  ✓ PASS — no User B data in list`);
  passed++;
}

// Test 3: search_todos — User B's todo should not appear
console.log("\nTEST 3: search_todos (User A searching 'SECRET-USER-B')");
const searchResult = await mcpCall(keyA_raw, "search_todos", { query: "SECRET-USER-B" });
const searchText = JSON.stringify(searchResult);
const leaked3 = searchText.includes("SECRET-USER-B-DO-NOT-LEAK") || searchText.includes(userBTodoId);
if (leaked3) {
  console.log(`  ❌ FAIL — leaked in search`);
  failed++;
} else {
  console.log(`  ✓ PASS — no User B data in search`);
  passed++;
}

// Test 4: Verify User A can read their OWN todo (sanity check)
console.log("\nTEST 4: get_todo (User A → own todo, should work)");
const ownTodo = await supabaseInsert("todos", {
  user_id: userIdA,
  title: "LEGITIMATE-USER-A-TODO",
  completed: false,
  priority: null,
  position: 0,
});
const ownResult = await mcpCall(keyA_raw, "get_todo", { id: ownTodo[0].id });
const ownText = ownResult?.result?.content?.[0]?.text || "";
if (ownText.includes("LEGITIMATE-USER-A-TODO")) {
  console.log(`  ✓ PASS — can read own todo`);
  passed++;
} else {
  console.log(`  ❌ FAIL — cannot read own todo: ${ownText.slice(0, 200)}`);
  failed++;
}

// Test 5: Verify User B can read their own todo (sanity check)
console.log("\nTEST 5: get_todo (User B → own todo, should work)");
const bOwnResult = await mcpCall(keyB_raw, "get_todo", { id: userBTodoId });
const bOwnText = bOwnResult?.result?.content?.[0]?.text || "";
if (bOwnText.includes("SECRET-USER-B-DO-NOT-LEAK")) {
  console.log(`  ✓ PASS — User B can read own todo`);
  passed++;
} else {
  console.log(`  ❌ FAIL — User B cannot read own todo: ${bOwnText.slice(0, 200)}`);
  failed++;
}

// --- Summary ---
console.log(`\n${"=".repeat(50)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed === 0) {
  console.log("ALL IDOR TESTS PASSED — no cross-account data leakage.");
} else {
  console.log("IDOR VULNERABILITY DETECTED — cross-account leakage found.");
}

// --- Step 5: Cleanup ---
console.log("\n=== Step 5: Cleanup ===");

// Delete test todos
await supabaseDelete("todos", `title=eq.SECRET-USER-B-DO-NOT-LEAK&user_id=eq.${userIdB}`);
await supabaseDelete("todos", `title=eq.LEGITIMATE-USER-A-TODO&user_id=eq.${userIdA}`);
console.log("  Deleted test todos");

// Delete API keys
await supabaseDelete("api_keys", `user_id=eq.${userIdA}`);
await supabaseDelete("api_keys", `user_id=eq.${userIdB}`);
console.log("  Deleted API keys");

// Delete Clerk test users
for (const uid of [userIdA, userIdB]) {
  await fetch(`https://api.clerk.com/v1/users/${uid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
  });
}
console.log("  Deleted Clerk test users");

console.log("\nDone.");
