import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase.js";

const PAGE_SIZE = 6;
const BUCKET = "cakes"; // ✅ must match your Supabase bucket name

export default function AdminCakes() {
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All Cakes");
  const [page, setPage] = useState(1);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    available: true,
    featured: false,
    image_url: "", // keep for edit mode (existing image)
  });

  // ✅ File + preview
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  async function fetchCakes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cakes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    setCakes(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCakes();
  }, []);

  // Build tabs from real backend categories
  const tabs = useMemo(() => {
    const map = new Map(); // lower => original
    cakes.forEach((c) => {
      const raw = (c.category || "").trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!map.has(key)) map.set(key, raw);
    });
    return ["All Cakes", ...Array.from(map.values()).sort((a, b) => a.localeCompare(b))];
  }, [cakes]);

  // Reset page when tab or search changes
  useEffect(() => setPage(1), [activeTab, search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return cakes.filter((c) => {
      const matchesTab =
        activeTab === "All Cakes"
          ? true
          : (c.category || "").trim().toLowerCase() === activeTab.trim().toLowerCase();

      const matchesSearch =
        !q ||
        (c.name || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [cakes, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  function cleanupPreviewUrl() {
    // ✅ avoid memory leak
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
  }

  function resetModalState() {
    cleanupPreviewUrl();
    setImageFile(null);
    setImagePreview("");
  }

  function closeModal() {
    setOpenModal(false);
    resetModalState();
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      name: "",
      price: "",
      category: "",
      description: "",
      available: true,
      featured: false,
      image_url: "",
    });
    resetModalState();
    setOpenModal(true);
  }

  function openEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      price: String(c.price ?? ""),
      category: c.category || "",
      description: c.description || "",
      available: !!c.available,
      featured: !!c.featured,
      image_url: c.image_url || "",
    });

    // keep existing as preview
    resetModalState();
    setImagePreview(c.image_url || "");
    setOpenModal(true);
  }

  async function onDelete(id) {
    if (!confirm("Delete this cake?")) return;
    const { error } = await supabase.from("cakes").delete().eq("id", id);
    if (error) alert(error.message);
    fetchCakes();
  }

  async function onToggleAvailable(c) {
    const { error } = await supabase
      .from("cakes")
      .update({ available: !c.available })
      .eq("id", c.id);
    if (error) alert(error.message);
    fetchCakes();
  }

  function getExt(file) {
    const name = (file?.name || "").toLowerCase();
    const ext = name.split(".").pop();
    if (!ext || ext === name) return "png";
    return ext;
  }

  // ✅ Upload file to Supabase Storage and return public URL
  async function uploadCakeImage(file) {
    const ext = getExt(file);
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `items/${fileName}`; // ✅ cleaner than cakes/cakes/...

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/*",
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  // Optional helper if you want to delete old storage file when replacing image
  // function extractStoragePathFromPublicUrl(publicUrl) {
  //   // works if your public URL ends with "/storage/v1/object/public/<bucket>/<path>"
  //   try {
  //     const idx = publicUrl.indexOf(`/object/public/${BUCKET}/`);
  //     if (idx === -1) return null;
  //     return publicUrl.substring(idx + `/object/public/${BUCKET}/`.length);
  //   } catch {
  //     return null;
  //   }
  // }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      // ✅ keep old image unless new file chosen
      let finalImageUrl = form.image_url?.trim() || null;

      if (imageFile) {
        // Optional delete old file (only if you want)
        // if (finalImageUrl) {
        //   const oldPath = extractStoragePathFromPublicUrl(finalImageUrl);
        //   if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
        // }

        finalImageUrl = await uploadCakeImage(imageFile);
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        category: form.category.trim() || null,
        image_url: finalImageUrl,
        available: !!form.available,
        featured: !!form.featured,
      };

      if (!payload.name || Number.isNaN(payload.price)) {
        alert("Please provide a valid name and price.");
        return;
      }

      const res = editingId
        ? await supabase.from("cakes").update(payload).eq("id", editingId)
        : await supabase.from("cakes").insert([payload]);

      if (res.error) throw res.error;

      closeModal();
      await fetchCakes();
    } catch (err) {
      console.error(err);
      alert(
        `Upload/Save failed.\n\n${err?.message || "Check Storage bucket + policies + auth session."}`
      );
    } finally {
      setSaving(false);
    }
  }

  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(filtered.length, page * PAGE_SIZE);

  return (
    <div className="min-h-[calc(100vh-48px)]">
      {/* Top search bar row */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-gray-400">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cakes by name or category..."
            className="w-full outline-none text-sm"
          />
        </div>

        <button className="w-9 h-9 rounded-full bg-soft flex items-center justify-center">
          🔔
        </button>
        <button className="w-9 h-9 rounded-full bg-soft flex items-center justify-center">
          🌙
        </button>
      </div>

      {/* Title row */}
      <div className="mt-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Manage Cakes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Keep your digital menu updated for your WhatsApp customers.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600
                     text-white font-extrabold px-5 py-3 rounded-full shadow-soft transition"
        >
          <span className="text-lg leading-none">＋</span>
          Add New Cake
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex items-center gap-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => {
          const active = t === activeTab;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={
                "pb-3 text-sm font-extrabold whitespace-nowrap " +
                (active ? "text-pink-600 border-b-2 border-pink-500" : "text-gray-500")
              }
            >
              {t}
              {t === "All Cakes" ? ` (${cakes.length})` : ""}
            </button>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="mt-6 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[90px_1.5fr_1fr_120px_2fr_120px] gap-3 px-5 py-4 text-xs font-extrabold text-gray-500 border-b border-gray-100">
          <div>IMAGE</div>
          <div>CAKE NAME</div>
          <div>CATEGORY</div>
          <div>PRICE</div>
          <div>DESCRIPTION</div>
          <div className="text-right">ACTIONS</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        ) : paged.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No cakes found.</div>
        ) : (
          paged.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[90px_1.5fr_1fr_120px_2fr_120px] gap-3 px-5 py-4 border-b border-gray-50 items-center"
            >
              <div>
                <img
                  src={c.image_url || "https://via.placeholder.com/96?text=Cake"}
                  alt={c.name}
                  className="w-12 h-12 rounded-full object-cover border border-gray-100"
                />
              </div>

              <div className="min-w-0">
                <div className="font-extrabold text-gray-900 truncate">{c.name}</div>
                <div className="text-xs mt-0.5">
                  {c.featured ? (
                    <span className="text-pink-600 font-bold">Bestseller</span>
                  ) : c.available ? (
                    <span className="text-green-600 font-bold">Available</span>
                  ) : (
                    <span className="text-gray-400 font-bold">Out of stock</span>
                  )}
                </div>
              </div>

              <div>
                <span className={badgeClass(c.category)}>
                  {(c.category || "—").toUpperCase()}
                </span>
              </div>

              <div className="font-extrabold text-gray-900">
                ${Number(c.price || 0).toFixed(2)}
              </div>

              <div className="text-sm text-gray-500 line-clamp-2">
                {c.description || "—"}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => openEdit(c)}
                  className="w-9 h-9 rounded-xl bg-soft hover:bg-white/70 border border-gray-200 flex items-center justify-center"
                  title="Edit"
                >
                  ✏️
                </button>

                <button
                  onClick={() => onToggleAvailable(c)}
                  className="w-9 h-9 rounded-xl bg-soft hover:bg-white/70 border border-gray-200 flex items-center justify-center"
                  title="Toggle availability"
                >
                  👁️
                </button>

                <button
                  onClick={() => onDelete(c.id)}
                  className="w-9 h-9 rounded-xl bg-soft hover:bg-white/70 border border-gray-200 flex items-center justify-center"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}

        <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-gray-500">
            Showing {showingFrom}-{showingTo} of {filtered.length} cakes
          </div>

          <div className="flex items-center gap-2">
            <PageBtn disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ‹
            </PageBtn>

            {getPageButtons(page, totalPages).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={
                  "w-9 h-9 rounded-xl border text-sm font-extrabold transition " +
                  (p === page
                    ? "bg-pink-500 text-white border-pink-500"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-soft")
                }
              >
                {p}
              </button>
            ))}

            <PageBtn disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              ›
            </PageBtn>
          </div>
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="font-extrabold text-gray-900">
                {editingId ? "Edit Cake" : "Add New Cake"}
              </div>
              <button
                onClick={closeModal}
                className="w-9 h-9 rounded-xl bg-soft border border-gray-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Cake Name">
                  <input
                    className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Chocolate Truffle Cake"
                    required
                  />
                </Field>

                <Field label="Price">
                  <input
                    className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="45"
                    inputMode="decimal"
                    required
                  />
                </Field>

                <Field label="Category">
                  <input
                    className="w-full rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Signature"
                  />
                </Field>

                {/* ✅ File picker + preview */}
                <Field label="Cake Image">
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 bg-white font-extrabold text-gray-700 hover:bg-soft cursor-pointer">
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // cleanup previous blob preview
                          cleanupPreviewUrl();

                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }}
                      />
                    </label>

                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-14 h-14 rounded-2xl object-cover border border-gray-100"
                      />
                    ) : (
                      <div className="text-xs text-gray-500">No image selected</div>
                    )}
                  </div>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        cleanupPreviewUrl();
                        setImageFile(null);
                        setImagePreview("");
                        // keep existing image_url if editing and user removed only preview
                        // If you want to remove image completely, uncomment:
                        // setForm((f) => ({ ...f, image_url: "" }));
                      }}
                      className="mt-2 text-xs font-extrabold text-pink-600 hover:underline"
                    >
                      Remove selected image
                    </button>
                  )}
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  className="w-full min-h-[90px] rounded-xl border border-pink-100 bg-soft px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Rich dark chocolate sponge layered with smooth ganache..."
                />
              </Field>

              <div className="flex items-center gap-4 flex-wrap pt-1">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  />
                  Available
                </label>

                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Featured
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-extrabold text-gray-700 hover:bg-soft"
                >
                  Cancel
                </button>

                <button
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold shadow-soft disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Cake"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold text-gray-700 mb-1">{label}</div>
      {children}
    </div>
  );
}

function PageBtn({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-700 font-extrabold
                 hover:bg-soft disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function getPageButtons(current, total) {
  const start = Math.max(1, current - 1);
  const end = Math.min(total, current + 2);
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

function badgeClass(category) {
  const c = (category || "").toLowerCase();
  if (c.includes("signature"))
    return "text-[10px] font-extrabold px-2 py-1 rounded-full bg-gray-100 text-gray-700";
  if (c.includes("season"))
    return "text-[10px] font-extrabold px-2 py-1 rounded-full bg-pink-100 text-pink-700";
  if (c.includes("wedding"))
    return "text-[10px] font-extrabold px-2 py-1 rounded-full bg-purple-100 text-purple-700";
  return "text-[10px] font-extrabold px-2 py-1 rounded-full bg-green-100 text-green-700";
}
