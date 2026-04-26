import { useState, useMemo, useEffect } from "react";

// Dán URL Web App của ông sau khi Deploy trên Google vào đây
const API_URL = "DÁN_URL_GOOGLE_SCRIPT_VÀO_ĐÂY";

const TRANG_THAI_LIST = ["Mới", "Đang tư vấn", "Đã gửi báo giá", "Đang suy nghĩ", "Chốt đơn", "Tạm dừng/Hủy"];
const SALE_LIST = ["Trần Huy Hoàng", "Đặng Quốc Việt", "Nguyễn Nhật Hưng"];

const STATUS_CONFIG = {
  "Mới":             { bg: "#E6F1FB", color: "#185FA5", dot: "#378ADD" },
  "Đang tư vấn":     { bg: "#EAF3DE", color: "#3B6D11", dot: "#639922" },
  "Đã gửi báo giá":  { bg: "#FAEEDA", color: "#854F0B", dot: "#EF9F27" },
  "Đang suy nghĩ":   { bg: "#EEEDFE", color: "#3C3489", dot: "#7F77DD" },
  "Chốt đơn":        { bg: "#E1F5EE", color: "#085041", dot: "#1D9E75" },
  "Tạm dừng/Hủy":   { bg: "#FCEBEB", color: "#791F1F", dot: "#E24B4A" },
};

const NGUON_CONFIG = {
  "TMĐT":       { bg: "#E6F1FB", color: "#185FA5" },
  "Facebook":   { bg: "#EEEDFE", color: "#3C3489" },
  "Zalo OA":    { bg: "#EAF3DE", color: "#3B6D11" },
};

function Badge({ label, config }) {
  return (
    <span style={{
      background: config.bg, color: config.color,
      fontSize: 11, fontWeight: 500, padding: "2px 8px",
      borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {config.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.dot, display: "inline-block" }} />}
      {label}
    </span>
  );
}

function CustomerCard({ customer, onClick }) {
  const sc = STATUS_CONFIG[customer.trangThai] || STATUS_CONFIG["Mới"];
  const nc = NGUON_CONFIG[customer.nguon] || { bg: "#eee", color: "#666" };
  const initials = customer.ten ? customer.ten.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase() : "??";
  return (
    <div onClick={() => onClick(customer)} style={{
      background: "white", border: "0.5px solid #eee",
      borderRadius: 16, padding: "14px 16px", cursor: "pointer", marginBottom: 12
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: sc.bg, color: sc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{customer.ten}</p>
            <Badge label={customer.trangThai} config={sc} />
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>{customer.sdt} · <Badge label={customer.nguon} config={nc} /></p>
        </div>
      </div>
    </div>
  );
}

function SaleView({ data, currentSale, onUpdate }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState({});
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => data.filter(d => d.sale === currentSale && (d.sdt?.includes(search) || d.ten?.toLowerCase().includes(search.toLowerCase()))), [data, currentSale, search]);

  const handleSave = async () => {
    setSaved(false);
    try {
      await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ id: selected.id, ...editData }) });
      setSaved(true);
      setTimeout(() => { onUpdate(); setSelected(null); setSaved(false); }, 1200);
    } catch (e) { alert("Lỗi khi lưu!"); }
  };

  if (selected) {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#666", padding: "10px 0" }}>← Quay lại</button>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ fontSize: 13, color: "#999" }}>Trạng thái</label>
          <select value={editData.trangThai} onChange={e => setEditData({...editData, trangThai: e.target.value})} style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}>
            {TRANG_THAI_LIST.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label style={{ fontSize: 13, color: "#999" }}>Ghi chú</label>
          <textarea value={editData.ghiChu} onChange={e => setEditData({...editData, ghiChu: e.target.value})} rows={4} style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }} />
          <button onClick={handleSave} style={{ background: saved ? "#1D9E75" : "#185FA5", color: "white", border: "none", padding: 14, borderRadius: 12, fontWeight: 500 }}>
            {saved ? "✓ Đã cập nhật" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm khách hàng..." style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #eee", marginBottom: 16 }} />
      {filtered.map(c => <CustomerCard key={c.id} customer={c} onClick={(cust) => { setSelected(cust); setEditData({trangThai: cust.trangThai, ghiChu: cust.ghiChu, henGoiLai: cust.henGoiLai}); }} />)}
    </div>
  );
}

function AdminView({ data }) {
  const stats = useMemo(() => {
    const counts = {};
    TRANG_THAI_LIST.forEach(t => counts[t] = 0);
    data.forEach(d => counts[d.trangThai] = (counts[d.trangThai] || 0) + 1);
    const chot = counts["Chốt đơn"] || 0;
    return { counts, chot, rate: data.length ? ((chot / data.length) * 100).toFixed(1) : 0 };
  }, [data]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: "#fff", padding: 15, borderRadius: 12, border: "1px solid #eee" }}>
          <p style={{ fontSize: 11, color: "#999", margin: 0 }}>TỔNG DATA</p>
          <p style={{ fontSize: 24, fontWeight: 500, margin: "5px 0" }}>{data.length}</p>
        </div>
        <div style={{ background: "#fff", padding: 15, borderRadius: 12, border: "1px solid #eee" }}>
          <p style={{ fontSize: 11, color: "#999", margin: 0 }}>TỶ LỆ CHỐT</p>
          <p style={{ fontSize: 24, fontWeight: 500, margin: "5px 0", color: "#1D9E75" }}>{stats.rate}%</p>
        </div>
      </div>
      <div style={{ marginTop: 20, background: "#fff", padding: 16, borderRadius: 14, border: "1px solid #eee" }}>
        <p style={{ fontWeight: 500, marginBottom: 15 }}>Phân bổ trạng thái</p>
        {TRANG_THAI_LIST.map(t => (
          <div key={t} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#666" }}>{t}</span>
            <span style={{ fontWeight: 500 }}>{stats.counts[t]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("sale");
  const [currentSale, setCurrentSale] = useState("Trần Huy Hoàng");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); }
    set