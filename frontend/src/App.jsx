import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  CreditCard,
  ArrowLeftRight,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Boxes,
  Clock3,
  CircleAlert,
  Menu,
  X,
  Pencil,
  Trash2,
  RefreshCw,
  Activity,
  ShieldCheck,
  Users,
} from "lucide-react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Products", icon: Package },
  { name: "Inventory", icon: Boxes },
  { name: "Godowns", icon: Warehouse },
  { name: "Orders", icon: ShoppingCart },
  { name: "Deliveries", icon: Truck },
  { name: "Resource Manager", icon: ShieldCheck },
  { name: "OS Monitor", icon: Activity },
  { name: "Transfers", icon: ArrowLeftRight },
  { name: "Customers", icon: Users },
  { name: "Payments", icon: CreditCard },
  { name: "Deadlock Manager", icon: ShieldCheck },
  { name: "Suppliers", icon: Truck },
  { name: "Purchase Orders", icon: ShoppingCart },
  { name: "Stock Movements", icon: Activity },
  { name: "Refunds", icon: CreditCard },
  { name: "Notifications", icon: Bell },
  { name: "Vehicles", icon: Truck },
  { name: "Delivery Personnel", icon: Users },
];

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #dfe3eb",
  borderRadius: "8px",
  marginTop: "6px",
  boxSizing: "border-box",
  font: "inherit",
  color: "#172033",
  backgroundColor: "#ffffff",
};

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    products: [],
    inventory: [],
    orders: [],
    payments: [],
  });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      if (!API_BASE) throw new Error("VITE_API_BASE_URL is not configured.");

      const endpoints = [
        `${API_BASE}/products`,
        `${API_BASE}/inventory`,
        `${API_BASE}/orders`,
        `${API_BASE}/payments`,
      ];

      const responses = await Promise.all(
        endpoints.map(async (url) => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Request failed: ${url} (${response.status})`);
          }
          return response.json();
        })
      );

      setDashboardData({
        products: responses[0],
        inventory: responses[1],
        orders: responses[2],
        payments: responses[3],
      });
      setApiError("");
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setApiError("Unable to load live data. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const totalStock = dashboardData.inventory.reduce(
    (sum, item) => sum + Number(item.quantity_on_hand || 0),
    0
  );

  const openAddProductForm = () => {
    setActivePage("Products");
    setShowProductForm(true);
  };

  const navigate = (name) => {
    setActivePage(name);
    if (name !== "Products") setShowProductForm(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "" : "sidebar-hidden"}`}>
        <div className="brand">
          <div className="brand-icon"><Boxes size={24} /></div>
          <div>
            <h2>StockFlow</h2>
            <span>INVENTORY OS</span>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-avatar">SF</div>
          <div>
            <strong>Warehouse HQ</strong>
            <span>Management workspace</span>
          </div>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav className="navigation">
          {menuItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${activePage === name ? "active" : ""}`}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === "Orders" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-dot" />
            <div>
              <strong>System operational</strong>
              <span>Local environment</span>
            </div>
          </div>
          <p>STOCKFLOW © 2026</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />
              <input placeholder="Search anything..." />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button notification-button" aria-label="Notifications">
              <Bell size={19} />
              <span />
            </button>
            <div className="profile-avatar">S</div>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span /> WAREHOUSE OVERVIEW</div>
              <h1>{activePage === "Dashboard" ? "Good to see you again." : activePage}</h1>
              <p>
                {activePage === "Products"
                  ? "View and manage your product catalogue."
                  : activePage === "Inventory"
                    ? "Check stock levels across all godowns."
                    : "Here's what's happening across your inventory today."}
              </p>
            </div>

            {(activePage === "Dashboard" || activePage === "Products") && (
              <button className="primary-button" onClick={openAddProductForm}>
                <Plus size={18} />
                Add new product
              </button>
            )}
          </div>

          {activePage === "Dashboard" ? (
            <>
              <div className="welcome-banner">
                <div className="banner-content">
                  <span className="banner-tag">YOUR OPERATIONS, SIMPLIFIED</span>
                  <h2>Every item. Every order.<br />Always in control.</h2>
                  <p>Manage your stock, coordinate warehouses, and keep every delivery moving.</p>
                  <button onClick={() => navigate("Inventory")}>
                    Explore inventory <span>→</span>
                  </button>
                </div>
                <div className="banner-art">
                  <div className="art-ring ring-one" />
                  <div className="art-ring ring-two" />
                  <div className="floating-card card-top">
                    <TrendingUp size={17} />
                    <span>Stock visibility</span>
                  </div>
                  <div className="warehouse-illustration">
                    <Warehouse size={105} strokeWidth={1.1} />
                    <div className="warehouse-box box-one" />
                    <div className="warehouse-box box-two" />
                    <div className="warehouse-box box-three" />
                  </div>
                  <div className="floating-card card-bottom">
                    <span className="status-dot" /> Operations active
                  </div>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Overview at a glance</h2>
                  <p>Your operational snapshot</p>
                </div>
                <span className="live-label"><span /> LIVE OVERVIEW</span>
              </div>

              {apiError && <p role="alert" className="api-error">{apiError}</p>}

              <div className="stats-grid">
                <StatCard icon={Package} label="Total products" value={loading ? "..." : dashboardData.products.length} note="Product catalogue" color="purple" />
                <StatCard icon={Boxes} label="Stock on hand" value={loading ? "..." : totalStock.toLocaleString()} note="Across all godowns" color="blue" />
                <StatCard icon={ShoppingCart} label="Total orders" value={loading ? "..." : dashboardData.orders.length} note="All recorded orders" color="orange" />
                <StatCard icon={CreditCard} label="Payments" value={loading ? "..." : dashboardData.payments.length} note="Recorded transactions" color="green" />
              </div>

              <div className="bottom-grid">
                <section className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Recent activity</h3>
                      <p>Your latest operational updates</p>
                    </div>
                    <button className="text-button" onClick={() => navigate("Orders")}>View orders →</button>
                  </div>
                  <div className="empty-state">
                    <div className="empty-icon"><Clock3 size={23} /></div>
                    <strong>Ready for your data</strong>
                    <p>Recent orders and stock movements will appear here once connected to your backend.</p>
                  </div>
                </section>

                <section className="panel attention-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Needs attention</h3>
                      <p>Keep operations running smoothly</p>
                    </div>
                    <CircleAlert size={19} className="attention-icon" />
                  </div>
                  <div className="attention-item">
                    <div className="attention-symbol"><Boxes size={18} /></div>
                    <div>
                      <strong>Stock monitoring</strong>
                      <p>Check products nearing their reorder levels.</p>
                    </div>
                  </div>
                  <div className="attention-item">
                    <div className="attention-symbol orange"><Truck size={18} /></div>
                    <div>
                      <strong>Delivery coordination</strong>
                      <p>Track assigned deliveries and their status.</p>
                    </div>
                  </div>
                  <button className="outline-button" onClick={() => navigate("Inventory")}>Review inventory</button>
                </section>
              </div>

              <footer className="page-footer">
                <span>StockFlow <span className="footer-separator">/</span> Smart Inventory Management</span>
                <span>Built for smarter warehouse operations</span>
              </footer>
            </>
          ) : activePage === "Products" ? (
            <ProductsPage
              showForm={showProductForm}
              setShowForm={setShowProductForm}
              onProductAdded={fetchDashboardData}
            />
          ) : activePage === "Inventory" ? (
            <InventoryPage />
          ) : activePage === "Godowns" ? (
            <GodownsPage />
          ) : activePage === "Orders" ? (
            <OrdersPage />
          ) : activePage === "Transfers" ? (
            <TransfersPage />
          ) : activePage === "Deliveries" ? (
            <DeliveriesPage />
          ) : activePage === "Payments" ? (
            <PaymentsPage />
          ) : activePage === "Customers" ? (
            <CustomersPage />
          ) : activePage === "Suppliers" ? (
            <SuppliersPage />
          ) : activePage === "Resource Manager" ? (
            <ResourceManagerPage />
          ) : activePage === "OS Monitor" ? (
            <OSActivityPage />
          ) : activePage === "Deadlock Manager" ? (
            <DeadlockManagerPage />
          ) : ["Purchase Orders", "Stock Movements", "Refunds", "Notifications", "Vehicles", "Delivery Personnel"].includes(activePage) ? (
            <OperationsPage page={activePage} />
          ) : (
            <div className="panel" style={{ padding: "24px", marginTop: "24px" }}>
              <h3>{activePage}</h3>
              <p>This page will be connected next.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon size={21} /></div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <div className="stat-note">{note}</div>
    </div>
  );
}

function ProductsPage({ showForm, setShowForm, onProductAdded }) {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState({
    sku: "",
    product_name: "",
    category_id: "",
    unit_price: "",
    reorder_level: "10",
  });

  const fetchProducts = useCallback(async () => {
    try {
      if (!API_BASE) throw new Error("VITE_API_BASE_URL is not configured.");
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) throw new Error("Failed to load products.");
      setProducts(await response.json());
      setError("");
    } catch (fetchError) {
      console.error("Failed to fetch products:", fetchError);
      setError("Unable to load products. Check that the backend is running.");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = () => {
    setFormData({
      sku: "",
      product_name: "",
      category_id: "",
      unit_price: "",
      reorder_level: "10",
    });
    setEditingProductId(null);
  };

  const startEditing = (product) => {
    setFormData({
      sku: product.sku ?? "",
      product_name: product.product_name ?? "",
      category_id: product.category_id == null ? "" : String(product.category_id),
      unit_price: String(product.unit_price ?? ""),
      reorder_level: String(product.reorder_level ?? 10),
    });
    setEditingProductId(product.product_id);
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const url = editingProductId
        ? `${API_BASE}/products/${editingProductId}`
        : `${API_BASE}/products`;
      const response = await fetch(url, {
        method: editingProductId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: formData.sku.trim(),
          product_name: formData.product_name.trim(),
          category_id: formData.category_id === "" ? null : Number(formData.category_id),
          unit_price: Number(formData.unit_price),
          reorder_level: Number(formData.reorder_level),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = Array.isArray(result.detail)
          ? result.detail.map((item) => item.msg).join(", ")
          : result.detail;
        throw new Error(detail || `Could not ${editingProductId ? "update" : "add"} product.`);
      }

      setMessage(editingProductId ? "Product updated successfully!" : "Product added successfully!");
      resetForm();
      setShowForm(false);
      await fetchProducts();
      await onProductAdded();
    } catch (submitError) {
      setError(submitError.message || "Could not save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.product_name}" (${product.sku})? This cannot be undone.`
    );
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/products/${product.product_id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = Array.isArray(result.detail)
          ? result.detail.map((item) => item.msg).join(", ")
          : result.detail;
        throw new Error(detail || "Could not delete product. It may be referenced by existing records.");
      }
      setMessage(`Product "${product.product_name}" deleted successfully.`);
      await fetchProducts();
      await onProductAdded();
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete product.");
    }
  };

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.trim().toLowerCase();
    return (
      String(product.sku ?? "").toLowerCase().includes(search) ||
      String(product.product_name ?? "").toLowerCase().includes(search)
    );
  });

  return (
    <section className="panel" style={{ padding: "24px", marginTop: "24px" }}>
      <div className="panel-heading" style={{ gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h3>Product catalogue</h3>
          <p>Manage all products in your warehouse.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <strong>{products.length} products</strong>
          <button
            type="button"
            className="outline-button"
            onClick={() => {
              if (showForm) resetForm();
              setShowForm(!showForm);
              setMessage("");
              setError("");
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Close form" : "Add product"}
          </button>
          <button type="button" className="outline-button" onClick={fetchProducts} aria-label="Refresh products">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {message && <p role="status" style={{ marginTop: "18px", color: "#16845b" }}>{message}</p>}
      {error && <p role="alert" style={{ marginTop: "18px", color: "#c0392b" }}>{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="product-form">
          <h3 style={{ marginTop: 0, marginBottom: "18px" }}>
            {editingProductId ? "Edit product" : "Add a new product"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <label>SKU *
              <input style={inputStyle} name="sku" value={formData.sku} onChange={handleInputChange} placeholder="e.g. STAT003" required />
            </label>
            <label>Product name *
              <input style={inputStyle} name="product_name" value={formData.product_name} onChange={handleInputChange} placeholder="Enter product name" required />
            </label>
            <label>Category ID
              <input style={inputStyle} type="number" min="1" name="category_id" value={formData.category_id} onChange={handleInputChange} placeholder="Optional" />
            </label>
            <label>Unit price (₹) *
              <input style={inputStyle} type="number" min="0.01" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleInputChange} placeholder="e.g. 99.50" required />
            </label>
            <label>Reorder level *
              <input style={inputStyle} type="number" min="0" step="1" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} required />
            </label>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingProductId ? "Save changes" : "Save product"}
            </button>
            <button
              className="outline-button"
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: "24px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <Search size={18} color="#7b8497" />
        <input
          style={{ ...inputStyle, marginTop: 0, maxWidth: "380px" }}
          type="search"
          placeholder="Search by SKU or product name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <span style={{ color: "#7b8497", fontSize: "14px" }}>
          Showing {filteredProducts.length} of {products.length}
        </span>
      </div>

      {loadingProducts ? (
        <p style={{ marginTop: "24px" }}>Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <p style={{ marginTop: "24px" }}>
          {products.length === 0 ? "No products found." : "No products match your search."}
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "18px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                <th style={cellStyle}>SKU</th>
                <th style={cellStyle}>Product name</th>
                <th style={cellStyle}>Category ID</th>
                <th style={cellStyle}>Unit price</th>
                <th style={cellStyle}>Reorder level</th>
                <th style={cellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.product_id}>
                  <td style={cellStyle}>{product.sku}</td>
                  <td style={cellStyle}>{product.product_name}</td>
                  <td style={cellStyle}>{product.category_id ?? "—"}</td>
                  <td style={cellStyle}>₹{Number(product.unit_price).toLocaleString("en-IN")}</td>
                  <td style={cellStyle}>{product.reorder_level}</td>
                  <td style={cellStyle}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="button" className="outline-button" onClick={() => startEditing(product)} aria-label={`Edit ${product.product_name}`}>
                        <Pencil size={15} /> Edit
                      </button>
                      <button type="button" className="outline-button" onClick={() => handleDelete(product)} aria-label={`Delete ${product.product_name}`}>
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}



function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [schedulerStatus, setSchedulerStatus] = useState({
    running: false,
    message: "Checking scheduler status...",
  });
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [startingScheduler, setStartingScheduler] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchDeliveries = useCallback(async () => {
    try {
      if (!API_BASE) throw new Error("VITE_API_BASE_URL is not configured.");
      const response = await fetch(`${API_BASE}/deliveries`);
      if (!response.ok) throw new Error("Failed to load deliveries.");
      setDeliveries(await response.json());
      setError("");
    } catch (fetchError) {
      console.error("Failed to fetch deliveries:", fetchError);
      setError(fetchError.message || "Unable to load deliveries.");
    } finally {
      setLoadingDeliveries(false);
    }
  }, []);

  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/deliveries/scheduler/status`);
      if (!response.ok) throw new Error("Failed to load scheduler status.");
      setSchedulerStatus(await response.json());
    } catch (statusError) {
      console.error("Failed to fetch scheduler status:", statusError);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchDeliveries(), fetchSchedulerStatus()]);
  }, [fetchDeliveries, fetchSchedulerStatus]);

  useEffect(() => {
    refreshAll();
    const intervalId = window.setInterval(refreshAll, 2500);
    return () => window.clearInterval(intervalId);
  }, [refreshAll]);

  const startScheduler = async () => {
    setStartingScheduler(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/deliveries/scheduler/start`, {
        method: "POST",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.detail || "Could not start the delivery scheduler.");
      }

      setMessage(result.message || "Delivery scheduler started.");
      await refreshAll();
    } catch (startError) {
      setError(startError.message || "Could not start the scheduler.");
    } finally {
      setStartingScheduler(false);
    }
  };

  const running = Boolean(schedulerStatus.running);

  const assignedCount = deliveries.filter(
    (item) => item.status === "assigned"
  ).length;

  const inTransitCount = deliveries.filter(
    (item) => item.status === "in_transit"
  ).length;

  const deliveredCount = deliveries.filter(
    (item) => item.status === "delivered"
  ).length;

  return (
    <section style={{ marginTop: "24px" }}>
      <div className="stats-grid">
        <StatCard
          icon={Truck}
          label="Total deliveries"
          value={loadingDeliveries ? "..." : deliveries.length}
          note="All delivery records"
          color="purple"
        />
        <StatCard
          icon={Clock3}
          label="Pending"
          value={loadingDeliveries ? "..." : assignedCount}
          note="Waiting for scheduling"
          color="orange"
        />
        <StatCard
          icon={TrendingUp}
          label="In transit"
          value={loadingDeliveries ? "..." : inTransitCount}
          note="Processing or dispatched"
          color="blue"
        />
        <StatCard
          icon={Package}
          label="Delivered"
          value={loadingDeliveries ? "..." : deliveredCount}
          note="Completed deliveries"
          color="green"
        />
      </div>

      <section className="panel" style={{ padding: "24px", marginTop: "24px" }}>
        <div className="panel-heading" style={{ gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h3>OS Delivery Scheduler</h3>
            <p>Priority-based scheduling powered by Python worker threads.</p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="outline-button"
              onClick={refreshAll}
            >
              <RefreshCw size={16} /> Refresh
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={startScheduler}
              disabled={running || startingScheduler}
            >
              <Truck size={16} />
              {startingScheduler
                ? "Starting..."
                : running
                  ? "Scheduler running..."
                  : "Start Scheduler"}
            </button>
          </div>
        </div>

        {/* Scheduler Status */}
        <div className={`scheduler-status ${running ? "running" : "idle"}`}>
          <span className="status-dot" />
          <div>
            <strong>
              {running ? "Scheduler running" : "Scheduler idle"}
            </strong>
            <p>{schedulerStatus.message}</p>
          </div>
        </div>

        {message && (
          <p
            role="status"
            style={{ marginTop: "16px", color: "#55d6a5" }}
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            style={{ marginTop: "16px", color: "#ff6b91" }}
          >
            {error}
          </p>
        )}

        {/* Deliveries Table */}
        <div style={{ marginTop: "22px", overflowX: "auto" }}>
          {loadingDeliveries ? (
            <p style={{ color: "#aab5c4" }}>Loading deliveries...</p>
          ) : deliveries.length === 0 ? (
            <p style={{ color: "#aab5c4" }}>
              No delivery records found. Create an order and assign a delivery first.
            </p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr>
                  <th style={cellStyle}>Delivery ID</th>
                  <th style={cellStyle}>Order ID</th>
                  <th style={cellStyle}>Priority</th>
                  <th style={cellStyle}>Godown</th>
                  <th style={cellStyle}>Personnel</th>
                  <th style={cellStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {deliveries.map((delivery) => {
                  const status = delivery.status || "unknown";

                  const statusClass =
                    status === "assigned"
                      ? "assigned"
                      : status === "in_transit"
                        ? "in-transit"
                        : status === "delivered"
                          ? "delivered"
                          : "unknown";

                  return (
                    <tr key={delivery.delivery_id}>
                      <td style={cellStyle}>#{delivery.delivery_id}</td>
                      <td style={cellStyle}>#{delivery.order_id}</td>
                      <td style={cellStyle}>{delivery.priority}</td>
                      <td style={cellStyle}>{delivery.godown_id ?? "—"}</td>
                      <td style={cellStyle}>{delivery.personnel_id ?? "—"}</td>
                      <td style={cellStyle}>
                        <span className={`delivery-status ${statusClass}`}>
                          {String(status).replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p
          style={{
            color: "#9ba7b8",
            fontSize: "13px",
            marginTop: "14px",
          }}
        >
          Delivery records and scheduler status refresh automatically every 2.5 seconds.
        </p>
      </section>
    </section>
  );
}


function ResourceManagerPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ product_id: "", godown_id: "", quantity: "1", notes: "StockFlow OS Resource Manager dispatch" });
  const [summary, setSummary] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [inventoryResponse, summaryResponse] = await Promise.all([
        fetch(`${API_BASE}/inventory`),
        fetch(`${API_BASE}/os/resource-manager/status`),
      ]);
      if (!inventoryResponse.ok || !summaryResponse.ok) throw new Error("Could not load inventory/resource status.");
      setInventory(await inventoryResponse.json());
      setSummary(await summaryResponse.json());
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load resource manager data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedRow = inventory.find((row) =>
    String(row.product_id) === form.product_id && String(row.godown_id) === form.godown_id
  );

  const dispatch = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${API_BASE}/os/resource-manager/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: Number(form.product_id),
          godown_id: Number(form.godown_id),
          quantity: Number(form.quantity),
          notes: form.notes.trim() || null,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || "Dispatch failed.");
      setMessage(result.message || "Stock dispatched successfully.");
      await loadData();
    } catch (dispatchError) {
      setError(dispatchError.message || "Dispatch failed.");
      await loadData();
    } finally { setSaving(false); }
  };

  const runSynchronizationTest = async () => {
    setTesting(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${API_BASE}/os/resource-manager/synchronization-test`, { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || "Synchronization test failed.");
      setMessage(`${result.message}. No inventory quantities were changed.`);
      await loadData();
    } catch (testError) {
      setError(testError.message || "Synchronization test failed.");
    } finally { setTesting(false); }
  };

  return (
    <section style={{ display: "grid", gap: "18px", marginTop: "24px" }}>
      <div className="stats-grid">
        <StatCard icon={Boxes} label="Inventory records" value={summary?.inventory_rows ?? "..."} note="Product/godown combinations" color="purple" />
        <StatCard icon={Package} label="Stock on hand" value={Number(summary?.total_on_hand ?? 0).toLocaleString("en-IN")} note="Total physical stock" color="blue" />
        <StatCard icon={Clock3} label="Allocated stock" value={Number(summary?.total_reserved ?? 0).toLocaleString("en-IN")} note={`${summary?.allocated_inventory_rows ?? 0} records have reservations`} color="orange" />
        <StatCard icon={ShieldCheck} label="Available stock" value={Number(summary?.total_available ?? 0).toLocaleString("en-IN")} note="On hand minus reserved" color="green" />
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div><h3>Resource allocation and synchronization</h3><p>View allocated inventory and verify safe resource-lock ordering.</p></div>
          <button type="button" className="outline-button" onClick={loadData}><RefreshCw size={16} /> Refresh</button>
        </div>
        <div className="os-info-grid">
          <div className="os-info-tile"><span>Inventory lock</span><strong>{summary?.locks?.inventory_lock_busy ? "Busy" : "Available"}</strong><small>Protects concurrent inventory operations</small></div>
          <div className="os-info-tile"><span>Delivery lock</span><strong>{summary?.locks?.delivery_lock_busy ? "Busy" : "Available"}</strong><small>Coordinates delivery resource access</small></div>
          <div className="os-info-tile"><span>Lock strategy</span><strong>Ordered locks</strong><small>Inventory lock → Delivery lock</small></div>
        </div>
        <p className="os-note"><strong>Database protection:</strong> Dispatch uses a Python thread lock and a conditional PostgreSQL UPDATE. The database check prevents dispatching more than the available quantity, including concurrent requests from other backend processes.</p>
        {message && <p role="status" className="os-success">{message}</p>}
        {error && <p role="alert" className="os-error">{error}</p>}
        <button type="button" className="outline-button" onClick={runSynchronizationTest} disabled={testing || loading}>
          <Activity size={16} /> {testing ? "Running two worker threads..." : "Run synchronization test"}
        </button>
        <p className="os-muted">This test starts two threads that request the same locks in the same order. It demonstrates synchronization and does not modify stock.</p>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h3>Dispatch through Resource Manager</h3><p>Perform an actual inventory dispatch using synchronized stock updates.</p></div></div>
        <form onSubmit={dispatch} className="os-form-grid">
          <label>Product / godown record
            <select style={inputStyle} value={`${form.product_id}|${form.godown_id}`} required onChange={(event) => {
              const [product_id, godown_id] = event.target.value.split("|");
              setForm((current) => ({ ...current, product_id, godown_id }));
            }}>
              <option value="|">Choose inventory record</option>
              {inventory.map((row) => <option key={`${row.product_id}-${row.godown_id}`} value={`${row.product_id}|${row.godown_id}`}>{row.product_name} — {row.godown_name} (available: {row.available_quantity})</option>)}
            </select>
          </label>
          <label>Quantity to dispatch
            <input style={inputStyle} type="number" min="1" step="1" required value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
          </label>
          <label>Notes
            <input style={inputStyle} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          <div className="os-form-action"><button className="primary-button" type="submit" disabled={saving || loading || !form.product_id || !form.godown_id}><Truck size={16} /> {saving ? "Dispatching..." : "Dispatch stock"}</button></div>
        </form>
        {selectedRow && <p className="os-muted">Available in this godown: <strong>{selectedRow.available_quantity}</strong> units</p>}
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h3>Current resource allocation</h3><p>Live inventory quantities and reservations from PostgreSQL.</p></div></div>
        {loading ? <p>Loading inventory...</p> : inventory.length === 0 ? <p>No inventory records found.</p> : (
          <div className="os-table-wrap"><table className="os-dark-table"><thead><tr><th>Product</th><th>Godown</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Allocation</th></tr></thead>
            <tbody>{inventory.map((row) => <tr key={`${row.product_id}-${row.godown_id}`}><td>{row.product_name}</td><td>{row.godown_name}</td><td>{row.quantity_on_hand}</td><td>{row.quantity_reserved}</td><td>{row.available_quantity}</td><td><span className={`os-pill ${Number(row.quantity_reserved) > 0 ? "warning" : "success"}`}>{Number(row.quantity_reserved) > 0 ? "Allocated" : "Free"}</span></td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </section>
  );
}


function DeadlockManagerPage() {
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchDeadlockData = useCallback(async () => {
    try {
      const [statusResponse, historyResponse] = await Promise.all([
        fetch(`${API_BASE}/os/deadlock/status`),
        fetch(`${API_BASE}/os/deadlock/history`),
      ]);
      if (!statusResponse.ok || !historyResponse.ok) throw new Error("Could not load deadlock information.");
      setResult(await statusResponse.json());
      setHistory(await historyResponse.json());
      setError("");
    } catch (err) { setError(err.message || "Could not load deadlock information."); }
  }, []);

  useEffect(() => { fetchDeadlockData(); }, [fetchDeadlockData]);

  const runSimulation = async (createCycle = true) => {
    setLoading(true); setError(""); setMessage("");
    const requestData = createCycle ? {
      dependencies: [
        { waiting_task: "Task_A", holding_task: "Task_B" },
        { waiting_task: "Task_B", holding_task: "Task_C" },
        { waiting_task: "Task_C", holding_task: "Task_A" },
      ],
      task_details: {
        Task_A: { priority: 3, completed_work: 5, recovery_cost: 4 },
        Task_B: { priority: 1, completed_work: 2, recovery_cost: 1 },
        Task_C: { priority: 2, completed_work: 4, recovery_cost: 3 },
      },
    } : {
      dependencies: [
        { waiting_task: "Task_A", holding_task: "Task_B" },
        { waiting_task: "Task_B", holding_task: "Task_C" },
      ],
      task_details: {
        Task_A: { priority: 2, completed_work: 1, recovery_cost: 2 },
        Task_B: { priority: 1, completed_work: 2, recovery_cost: 1 },
        Task_C: { priority: 3, completed_work: 3, recovery_cost: 3 },
      },
    };

    try {
      const response = await fetch(`${API_BASE}/os/deadlock/simulate`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestData),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Deadlock simulation failed.");
      setResult(data);
      setMessage(createCycle ? "Circular wait detected and recovery simulation completed." : "No-deadlock scenario completed successfully.");
      await fetchDeadlockData();
    } catch (err) { setError(err.message || "Simulation failed."); }
    finally { setLoading(false); }
  };

  const hasCycle = Boolean(result?.deadlock_detected);
  return (
    <section className="os-page-stack">
      <section className="panel">
        <div className="panel-heading"><div><h3>Deadlock Detection and Recovery</h3><p>Build a wait-for graph, detect circular waits and demonstrate victim selection.</p></div><ShieldCheck size={24} color="#ff4f91" /></div>
        <div className="deadlock-info-box"><strong>Simulation only</strong><p>This module demonstrates the deadlock algorithm using sample tasks. It does not stop or terminate real application processes or database transactions.</p></div>
        <div className="os-action-row">
          <button className="primary-button" onClick={() => runSimulation(true)} disabled={loading}><Activity size={16} /> {loading ? "Running..." : "Run deadlock scenario"}</button>
          <button className="outline-button" onClick={() => runSimulation(false)} disabled={loading}>Test no-deadlock scenario</button>
          <button className="outline-button" onClick={fetchDeadlockData}><RefreshCw size={16} /> Refresh</button>
        </div>
        {message && <p role="status" className="os-success">{message}</p>}
        {error && <p role="alert" className="os-error">{error}</p>}
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h3>Detection results</h3><p>Latest wait-for graph analysis and recovery state.</p></div><span className={`os-pill ${hasCycle ? "warning" : result?.status === "no_deadlock" ? "success" : "neutral"}`}>{result?.status || "Not run"}</span></div>
        <div className="stats-grid" style={{ marginTop: "18px" }}>
          <StatCard icon={CircleAlert} label="Deadlock detected" value={result ? (hasCycle ? "Yes" : "No") : "—"} note="Cycle detection" color="orange" />
          <StatCard icon={ShieldCheck} label="Selected victim" value={result?.victim || "—"} note="Recovery candidate" color="purple" />
          <StatCard icon={Activity} label="Recovery" value={result ? (result.recovery_completed ? "Completed" : hasCycle ? "Not completed" : "Not needed") : "—"} note="Recovery outcome" color="green" />
        </div>
        <div className="os-info-grid" style={{ marginTop: "18px" }}>
          <div className="os-info-tile"><span>Detected cycle</span><strong>{result?.cycle?.length ? result.cycle.join(" → ") : "None"}</strong><small>Wait-for dependency sequence</small></div>
          <div className="os-info-tile"><span>Last simulation</span><strong>{result?.last_updated ? new Date(result.last_updated).toLocaleString() : "Not available"}</strong><small>Backend simulation timestamp</small></div>
        </div>
        <h4 className="os-subheading">Final wait-for graph</h4>
        <pre className="deadlock-graph">{JSON.stringify(result?.final_graph || {}, null, 2)}</pre>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h3>Deadlock event history</h3><p>Detection, victim selection and recovery events from the OS activity log.</p></div><span className="os-muted">{history.length} event(s)</span></div>
        {history.length === 0 ? <div className="empty-state"><strong>No deadlock events yet</strong><p>Run either simulation to populate this history.</p></div> : (
          <div className="os-table-wrap"><table className="os-dark-table"><thead><tr><th>Time</th><th>Event</th><th>Details</th><th>Type</th></tr></thead><tbody>
            {history.map((event, index) => <tr key={`${event.timestamp}-${index}`}><td>{new Date(event.timestamp).toLocaleString()}</td><td><strong>{event.event}</strong></td><td>{event.details}</td><td><span className={`os-pill ${event.event_type === "warning" ? "warning" : event.event_type === "success" ? "success" : "neutral"}`}>{event.event_type}</span></td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </section>
  );
}


function OSActivityPage() {
  const [events, setEvents] = useState([]);
  const [monitor, setMonitor] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchMonitorData = useCallback(async () => {
    try {
      const [eventsResponse, monitorResponse] = await Promise.all([
        fetch(`${API_BASE}/os/activity`),
        fetch(`${API_BASE}/os/monitor/status`),
      ]);
      if (!eventsResponse.ok || !monitorResponse.ok) throw new Error("Could not load OS monitoring information.");
      setEvents(await eventsResponse.json());
      setMonitor(await monitorResponse.json());
      setError("");
    } catch (fetchError) { setError(fetchError.message || "Could not load OS activity."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchMonitorData();
    const timer = window.setInterval(fetchMonitorData, 3000);
    return () => window.clearInterval(timer);
  }, [fetchMonitorData]);

  const startScheduler = async () => {
    setStarting(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${API_BASE}/deliveries/scheduler/start`, { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || "Could not start delivery scheduler.");
      setMessage(result.message || "Delivery scheduler started.");
      await fetchMonitorData();
    } catch (startError) { setError(startError.message || "Could not start scheduler."); }
    finally { setStarting(false); }
  };

  const schedulerRunning = Boolean(monitor?.scheduler?.running);
  const deliveries = monitor?.deliveries || {};
  const typeColor = (type) => ({ success: "#55d6a5", warning: "#ffb86b", lock: "#a99aff", info: "#69b7f2" }[type] || "#aab5c4");

  return (
    <section className="os-page-stack">
      <section className="panel">
        <div className="panel-heading"><div><h3>Operating System Monitor</h3><p>Live view of delivery scheduling, worker activity, synchronization and system events.</p></div><button type="button" className="outline-button" onClick={fetchMonitorData}><RefreshCw size={16} /> Refresh</button></div>
        {message && <p role="status" className="os-success">{message}</p>}
        {error && <p role="alert" className="os-error">{error}</p>}
        <div className="os-info-grid" style={{ marginTop: "18px" }}>
          <div className="os-info-tile"><span>Backend monitor</span><strong>{monitor?.monitor_status || (loading ? "Loading" : "Unavailable")}</strong><small>API and database monitoring endpoint</small></div>
          <div className="os-info-tile"><span>Delivery scheduler</span><strong>{schedulerRunning ? "Running" : "Idle"}</strong><small>{monitor?.scheduler?.message || "Scheduler status unavailable"}</small></div>
          <div className="os-info-tile"><span>Worker threads</span><strong>{monitor?.worker_count ?? "—"}</strong><small>Configured delivery workers</small></div>
          <div className="os-info-tile"><span>Queue size</span><strong>{monitor?.delivery_queue_size ?? "—"}</strong><small>Current in-memory priority queue</small></div>
        </div>
        <div className="os-action-row"><button className="primary-button" type="button" onClick={startScheduler} disabled={starting || schedulerRunning}><Activity size={16} /> {starting ? "Starting..." : schedulerRunning ? "Scheduler running" : "Start delivery scheduler"}</button><span className="os-muted">The scheduler processes deliveries already marked as assigned.</span></div>
      </section>

      <div className="stats-grid">
        <StatCard icon={Truck} label="Total deliveries" value={deliveries.total_deliveries ?? "—"} note="Database records" color="blue" />
        <StatCard icon={Clock3} label="Assigned" value={deliveries.assigned_deliveries ?? "—"} note="Waiting for scheduler" color="orange" />
        <StatCard icon={Activity} label="In transit" value={deliveries.in_transit_deliveries ?? "—"} note="Being processed" color="purple" />
        <StatCard icon={ShieldCheck} label="Delivered" value={deliveries.delivered_deliveries ?? "—"} note="Completed delivery records" color="green" />
      </div>

      <section className="panel">
        <div className="panel-heading"><div><h3>Synchronization status</h3><p>Current lock availability reported by the backend process.</p></div></div>
        <div className="os-info-grid">
          <div className="os-info-tile"><span>Inventory lock</span><strong>{monitor?.lock_status?.inventory_lock_busy ? "Busy" : "Available"}</strong><small>Protects inventory dispatch critical section</small></div>
          <div className="os-info-tile"><span>Delivery lock</span><strong>{monitor?.lock_status?.delivery_lock_busy ? "Busy" : "Available"}</strong><small>Protects shared delivery resource operations</small></div>
          <div className="os-info-tile"><span>Recent events</span><strong>{monitor?.recent_event_count ?? events.length}</strong><small>In-memory event buffer</small></div>
          <div className="os-info-tile"><span>Warnings</span><strong>{monitor?.warning_count ?? 0}</strong><small>Recent rejected or failed operations</small></div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h3>Live OS activity</h3><p>Delivery scheduler, worker, lock and inventory events.</p></div><span className="os-muted">Auto-refresh: 3 seconds</span></div>
        {loading ? <p>Loading OS activity...</p> : events.length === 0 ? <div className="empty-state"><div className="empty-icon"><Activity size={23} /></div><strong>No OS events yet</strong><p>Start the delivery scheduler, run a synchronization test or dispatch stock through Resource Manager.</p></div> : (
          <div className="os-table-wrap"><table className="os-dark-table"><thead><tr><th>Time</th><th>Event</th><th>Details</th><th>Type</th></tr></thead><tbody>
            {events.map((event, index) => <tr key={`${event.timestamp}-${index}`}><td>{new Date(event.timestamp).toLocaleString()}</td><td><strong>{event.event}</strong></td><td>{event.details}</td><td><span style={{ color: typeColor(event.event_type), fontWeight: 700 }}>{event.event_type}</span></td></tr>)}
          </tbody></table></div>
        )}
        <p className="os-muted">The activity feed is stored in memory and resets when the backend restarts. Delivery counts are read from PostgreSQL.</p>
      </section>
    </section>
  );
}

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInventory = useCallback(async () => {
    try {
      if (!API_BASE) throw new Error("VITE_API_BASE_URL is not configured.");
      const response = await fetch(`${API_BASE}/inventory`);
      if (!response.ok) throw new Error("Failed to load inventory.");
      const data = await response.json();
      setInventory(data);
      setError("");
    } catch (fetchError) {
      console.error("Failed to fetch inventory:", fetchError);
      setError("Unable to load inventory. Check the backend connection.");
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const filteredInventory = inventory.filter((item) => {
    const search = searchTerm.trim().toLowerCase();
    return (
      String(item.product_name ?? "").toLowerCase().includes(search) ||
      String(item.sku ?? "").toLowerCase().includes(search) ||
      String(item.godown_name ?? "").toLowerCase().includes(search) ||
      String(item.godown_id ?? "").includes(search)
    );
  });

  const totalOnHand = filteredInventory.reduce(
    (sum, item) => sum + Number(item.quantity_on_hand || 0), 0
  );

  const totalReserved = filteredInventory.reduce(
    (sum, item) => sum + Number(item.quantity_reserved || 0), 0
  );

  return (
    <section className="panel" style={{ padding: "24px", marginTop: "24px" }}>
      <div className="panel-heading" style={{ gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h3>Inventory by godown</h3>
          <p>Current stock quantities from your inventory database.</p>
        </div>

        <button type="button" className="outline-button" onClick={fetchInventory}>
          <RefreshCw size={16} /> Refresh stock
        </button>
      </div>

      {error && (
        <p role="alert" style={{ marginTop: "18px", color: "#ff6b81" }}>
          {error}
        </p>
      )}

      {/* Inventory Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: "14px",
        marginTop: "22px"
      }}>
        <div className="inventory-summary-card">
          <p>Stock on hand</p>
          <h2>
            {loadingInventory ? "..." : totalOnHand.toLocaleString("en-IN")}
          </h2>
        </div>

        <div className="inventory-summary-card">
          <p>Reserved units</p>
          <h2>
            {loadingInventory ? "..." : totalReserved.toLocaleString("en-IN")}
          </h2>
        </div>

        <div className="inventory-summary-card">
          <p>Product/godown rows</p>
          <h2>
            {loadingInventory ? "..." : inventory.length}
          </h2>
        </div>
      </div>

      {/* Search */}
      <div style={{
        marginTop: "22px",
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <Search size={18} color="#9ba7b8" />

        <input
          style={{ ...inputStyle, marginTop: 0, maxWidth: "380px" }}
          type="search"
          placeholder="Search product or godown..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <span style={{ color: "#9ba7b8", fontSize: "14px" }}>
          {filteredInventory.length} rows
        </span>
      </div>

      {/* Inventory Table */}
      {loadingInventory ? (
        <p style={{ marginTop: "24px", color: "#aab5c4" }}>
          Loading inventory...
        </p>
      ) : filteredInventory.length === 0 ? (
        <p style={{ marginTop: "24px", color: "#aab5c4" }}>
          No inventory records match your search.
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "18px" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left"
          }}>
            <thead>
              <tr>
                <th style={cellStyle}>Product</th>
                <th style={cellStyle}>SKU</th>
                <th style={cellStyle}>Godown</th>
                <th style={cellStyle}>On hand</th>
                <th style={cellStyle}>Reserved</th>
                <th style={cellStyle}>Available</th>
              </tr>
            </thead>

            <tbody>
              {filteredInventory.map((item, index) => {
                const onHand = Number(item.quantity_on_hand || 0);
                const reserved = Number(item.quantity_reserved || 0);
                const available =
                  item.available_quantity == null
                    ? onHand - reserved
                    : Number(item.available_quantity);

                return (
                  <tr key={`${item.godown_id}-${item.product_id}-${index}`}>
                    <td style={cellStyle}>
                      {item.product_name ?? `Product #${item.product_id ?? "—"}`}
                    </td>
                    <td style={cellStyle}>{item.sku ?? "—"}</td>
                    <td style={cellStyle}>
                      {item.godown_name ?? `Godown #${item.godown_id ?? "—"}`}
                    </td>
                    <td style={cellStyle}>{onHand.toLocaleString("en-IN")}</td>
                    <td style={cellStyle}>{reserved.toLocaleString("en-IN")}</td>
                    <td style={cellStyle}>{available.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


function GodownsPage() {
  const [godowns, setGodowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGodowns = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/godowns`);

      if (!response.ok) {
        throw new Error("Failed to load godowns.");
      }

      const data = await response.json();
      setGodowns(data);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load godowns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGodowns();
  }, [fetchGodowns]);

  return (
    <section className="panel" style={{ padding: "24px", marginTop: "24px" }}>
      <div className="panel-heading">
        <div>
          <h3>Warehouse Management</h3>
          <p>All registered godowns and their locations.</p>
        </div>

        <button className="outline-button" onClick={fetchGodowns}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <p style={{ color: "#ff6b81", marginTop: "18px" }}>{error}</p>
      )}

      {loading ? (
        <p style={{ marginTop: "20px" }}>Loading godowns...</p>
      ) : (
        <>
          <div className="stats-grid" style={{ marginTop: "20px" }}>
            <StatCard
              icon={Warehouse}
              label="Total godowns"
              value={godowns.length}
              note="Registered warehouses"
              color="blue"
            />
            <StatCard
              icon={ShieldCheck}
              label="Active godowns"
              value={godowns.filter((g) => g.is_active).length}
              note="Currently operational"
              color="green"
            />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginTop: "24px"
          }}>
            {godowns.map((godown) => (
              <div
                key={godown.godown_id}
                className="panel"
                style={{ padding: "20px" }}
              >
                <Warehouse size={28} color="#4388e8" />

                <h3 style={{ marginTop: "14px" }}>
                  {godown.godown_name}
                </h3>

                <p style={{ color: "#9ba7b8", marginTop: "8px" }}>
                  {godown.address}
                </p>

                <p style={{
                  marginTop: "14px",
                  color: godown.is_active ? "#20b981" : "#ef6464",
                  fontWeight: 600
                }}>
                  {godown.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}


function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [orderRes, customerRes, productRes] = await Promise.all([
        fetch(`${API_BASE}/orders`),
        fetch(`${API_BASE}/customers`),
        fetch(`${API_BASE}/products`)
      ]);

      if (!orderRes.ok || !customerRes.ok || !productRes.ok) {
        throw new Error("Failed to load order data.");
      }

      const [orderData, customerData, productData] = await Promise.all([
        orderRes.json(),
        customerRes.json(),
        productRes.json()
      ]);

      setOrders(orderData);
      setCustomers(customerData);
      setProducts(productData.filter((p) => p.is_active !== false));
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCustomerChange = (value) => {
    setCustomerId(value);

    const selected = customers.find(
      (customer) => String(customer.customer_id) === value
    );

    setDeliveryAddress(selected?.address || "");
  };

  const createOrder = async (event) => {
    event.preventDefault();

    if (!customerId || !productId || !deliveryAddress.trim()) {
      setError("Please fill all order details.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: Number(customerId),
          delivery_address: deliveryAddress,
          items: [{
            product_id: Number(productId),
            quantity: Number(quantity)
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not create order.");
      }

      setMessage(`Order #${data.order_id} created successfully!`);
      setCustomerId("");
      setProductId("");
      setQuantity(1);
      setDeliveryAddress("");

      await fetchData();
    } catch (err) {
      setError(err.message || "Could not create order.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const response = await fetch(
        `${API_BASE}/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Status update failed.");
      }

      setMessage(`Order #${orderId} status updated.`);
      await fetchData();
    } catch (err) {
      setError(err.message || "Status update failed.");
    }
  };

  return (
    <section className="panel" style={{ padding: "24px", marginTop: "24px" }}>
      <div className="panel-heading">
        <div>
          <h3>Order Management</h3>
          <p>Create orders and manage their status.</p>
        </div>

        <button className="outline-button" onClick={fetchData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <p style={{ color: "#ff6b81", marginTop: "16px" }}>{error}</p>
      )}

      {message && (
        <p style={{ color: "#20b981", marginTop: "16px" }}>{message}</p>
      )}

      <div style={{ marginTop: "24px", maxWidth: "600px" }}>
        <h3>Create New Order</h3>

        <form onSubmit={createOrder}>
          <label>Customer</label>
          <select
            style={inputStyle}
            value={customerId}
            onChange={(e) => handleCustomerChange(e.target.value)}
            required
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.customer_id} value={customer.customer_id}>
                {customer.customer_name}
              </option>
            ))}
          </select>

          <label style={{ display: "block", marginTop: "14px" }}>
            Product
          </label>
          <select
            style={inputStyle}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                {product.product_name} - ₹{product.unit_price}
              </option>
            ))}
          </select>

          <label style={{ display: "block", marginTop: "14px" }}>
            Quantity
          </label>
          <input
            style={inputStyle}
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <label style={{ display: "block", marginTop: "14px" }}>
            Delivery Address
          </label>
          <textarea
            style={inputStyle}
            rows="3"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Customer delivery address"
            required
          />

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
            style={{ marginTop: "18px" }}
          >
            <Plus size={17} />
            {saving ? "Creating..." : "Create Order"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: "35px" }}>
        <h3>All Orders</h3>

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p style={{ marginTop: "18px" }}>No orders found.</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "18px" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left"
            }}>
              <thead>
                <tr>
                  <th style={cellStyle}>Order ID</th>
                  <th style={cellStyle}>Customer</th>
                  <th style={cellStyle}>Date</th>
                  <th style={cellStyle}>Amount</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Update Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td style={cellStyle}>#{order.order_id}</td>
                    <td style={cellStyle}>{order.customer_name}</td>
                    <td style={cellStyle}>
                      {order.order_date
                        ? new Date(order.order_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={cellStyle}>
                      ₹{Number(order.total_amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td style={cellStyle}>{order.status}</td>
                    <td style={cellStyle}>
                      <select
                        style={{ ...inputStyle, marginTop: 0, minWidth: "140px" }}
                        value={order.status}
                        onChange={(e) =>
                          updateStatus(order.order_id, e.target.value)
                        }
                      >
                        {[
                          "pending",
                          "confirmed",
                          "processing",
                          "dispatched",
                          "delivered",
                          "cancelled"
                        ].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}


function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [godowns, setGodowns] = useState([]);

  const [productId, setProductId] = useState("");
  const [fromGodown, setFromGodown] = useState("");
  const [toGodown, setToGodown] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);

      const [transferRes, productRes, godownRes] = await Promise.all([
        fetch(`${API_BASE}/transfers`),
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/godowns`)
      ]);

      if (!transferRes.ok || !productRes.ok || !godownRes.ok) {
        throw new Error("Unable to load transfer data.");
      }

      const transferData = await transferRes.json();
      const productData = await productRes.json();
      const godownData = await godownRes.json();

      setTransfers(transferData);
      setProducts(productData);
      setGodowns(godownData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createTransfer = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!productId || !fromGodown || !toGodown || !quantity) {
      setError("Please fill all fields.");
      return;
    }

    if (fromGodown === toGodown) {
      setError("Source and destination godowns must be different.");
      return;
    }

    if (Number(quantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}/inventory/transfer-stock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            product_id: Number(productId),
            from_godown_id: Number(fromGodown),
            to_godown_id: Number(toGodown),
            quantity: Number(quantity)
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Stock transfer failed.");
      }

      setSuccess("Stock transferred successfully!");

      setProductId("");
      setFromGodown("");
      setToGodown("");
      setQuantity("");

      await loadData();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const uniqueTransfers = new Set(
    transfers.map(t => t.transfer_id)
  ).size;

  const completedTransfers = transfers.filter(
    t => t.status === "completed"
  ).length;

  const pendingTransfers = transfers.filter(
    t => t.status === "requested" || t.status === "in_transit"
  ).length;

  return (
    <div className="page-content transfer-page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Stock Transfers</h1>
          <p>Manage stock movement between different godowns.</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="stats-grid">

        <StatCard
          title="Total Transfers"
          value={uniqueTransfers}
          icon={ArrowLeftRight}
        />

        <StatCard
          title="Completed Transfers"
          value={completedTransfers}
          icon={Package}
        />

        <StatCard
          title="Pending / In Transit"
          value={pendingTransfers}
          icon={Clock3}
        />

      </div>

      {/* CREATE TRANSFER */}
      <div className="panel transfer-form-panel">

        <h2>Create Stock Transfer</h2>

        <form
          onSubmit={createTransfer}
          className="transfer-form-grid"
        >

          <div className="transfer-field">
            <label>Product</label>

            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              required
            >
              <option value="">Select Product</option>

              {products.map(p => (
                <option
                  key={p.product_id}
                  value={p.product_id}
                >
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>

          <div className="transfer-field">
            <label>Source Godown</label>

            <select
              value={fromGodown}
              onChange={e => setFromGodown(e.target.value)}
              required
            >
              <option value="">Select Source</option>

              {godowns.map(g => (
                <option
                  key={g.godown_id}
                  value={g.godown_id}
                >
                  {g.godown_name}
                </option>
              ))}
            </select>
          </div>

          <div className="transfer-field">
            <label>Destination Godown</label>

            <select
              value={toGodown}
              onChange={e => setToGodown(e.target.value)}
              required
            >
              <option value="">Select Destination</option>

              {godowns
                .filter(
                  g => String(g.godown_id) !== fromGodown
                )
                .map(g => (
                  <option
                    key={g.godown_id}
                    value={g.godown_id}
                  >
                    {g.godown_name}
                  </option>
                ))}
            </select>
          </div>

          <div className="transfer-field">
            <label>Quantity</label>

            <input
              type="number"
              min="1"
              placeholder="Enter quantity"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="transfer-submit"
            disabled={saving}
          >
            {saving ? "Transferring..." : "Transfer Stock"}
          </button>

        </form>

        {error && (
          <p style={{ color: "#dc2626", marginTop: 16 }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{ color: "#15803d", marginTop: 16 }}>
            {success}
          </p>
        )}

      </div>

      {/* TRANSFER HISTORY */}
      <div className="panel transfer-history-panel">

        <h2>Transfer History</h2>

        {loading ? (
          <p>Loading transfers...</p>
        ) : transfers.length === 0 ? (
          <p>No transfers found.</p>
        ) : (

          <div style={{ overflowX: "auto" }}>

            <table style={{
              width: "100%",
              borderCollapse: "collapse"
            }}>

              <thead>
                <tr>
                  <th style={cellStyle}>Transfer ID</th>
                  <th style={cellStyle}>Product</th>
                  <th style={cellStyle}>Quantity</th>
                  <th style={cellStyle}>Source Godown</th>
                  <th style={cellStyle}>Destination Godown</th>
                  <th style={cellStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {transfers.map((t, index) => (
                  <tr
                    key={`${t.transfer_id}-${t.product_id}-${index}`}
                  >
                    <td style={cellStyle}>#{t.transfer_id}</td>
                    <td style={cellStyle}>{t.product_name}</td>
                    <td style={cellStyle}>{t.quantity}</td>
                    <td style={cellStyle}>{t.from_godown}</td>
                    <td style={cellStyle}>{t.to_godown}</td>
                    <td style={cellStyle}>{t.status}</td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}


function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [orderId, setOrderId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [channel, setChannel] = useState("simulated_online");
  const [reference, setReference] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPayments = async () => {
    try {
      setLoading(true);

      const [paymentRes, orderRes, customerRes] = await Promise.all([
        fetch(`${API_BASE}/payments`),
        fetch(`${API_BASE}/orders`),
        fetch(`${API_BASE}/customers`)
      ]);

      if (!paymentRes.ok || !orderRes.ok || !customerRes.ok) {
        throw new Error("Unable to load payment data.");
      }

      setPayments(await paymentRes.json());
      setOrders(await orderRes.json());
      setCustomers(await customerRes.json());

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const createPayment = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!orderId || !customerId || !amount || !method || !channel) {
      setError("Please fill all required fields.");
      return;
    }

    if (Number(amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          order_id: Number(orderId),
          payer_customer_id: Number(customerId),
          amount: Number(amount),
          payment_method: method,
          payment_channel: channel,
          transaction_reference: reference.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Payment creation failed.");
      }

      setSuccess("Payment recorded successfully!");

      setOrderId("");
      setCustomerId("");
      setAmount("");
      setMethod("UPI");
      setChannel("simulated_online");
      setReference("");

      await loadPayments();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0), 0
  );

  const successfulPayments = payments.filter(
    p => p.status === "succeeded"
  ).length;

  const failedPayments = payments.filter(
    p => p.status === "failed"
  ).length;

  const formatDate = date =>
    date ? new Date(date).toLocaleString("en-IN") : "—";

  return (
    <div className="page-content payments-page">

      {/* HEADER */}
      <div className="payments-header">
        <div>
          <h1>Payments</h1>
          <p>Monitor transactions and payment activities.</p>
        </div>

        <button
          className="payments-refresh"
          onClick={loadPayments}
          disabled={loading}
        >
          <RefreshCw size={15} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="payments-stats">

        <StatCard
          title="Total Payments"
          value={payments.length}
          icon={CreditCard}
        />

        <StatCard
          title="Total Amount"
          value={`₹${totalAmount.toLocaleString("en-IN")}`}
          icon={TrendingUp}
        />

        <StatCard
          title="Successful"
          value={successfulPayments}
          icon={ShieldCheck}
        />

        <StatCard
          title="Failed"
          value={failedPayments}
          icon={CircleAlert}
        />

      </div>

      {/* CREATE PAYMENT FORM */}
      <div className="payments-create-panel">

        <h2>Record New Payment</h2>

        <form
          onSubmit={createPayment}
          className="payments-form-grid"
        >

          <div className="payments-field">
            <label>Order</label>

            <select
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              required
            >
              <option value="">Select Order</option>

              {orders.map(order => (
                <option
                  key={order.order_id}
                  value={order.order_id}
                >
                  Order #{order.order_id}
                </option>
              ))}
            </select>
          </div>

          <div className="payments-field">
            <label>Customer</label>

            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              required
            >
              <option value="">Select Customer</option>

              {customers.map(customer => (
                <option
                  key={customer.customer_id}
                  value={customer.customer_id}
                >
                  {customer.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div className="payments-field">
            <label>Amount (₹)</label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="payments-field">
            <label>Payment Method</label>

            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              required
            >
              <option value="UPI">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div className="payments-field">
            <label>Payment Channel</label>

            <select
              value={channel}
              onChange={e => setChannel(e.target.value)}
              required
            >
              <option value="simulated_online">Simulated Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="payments-field">
            <label>Transaction Reference (Optional)</label>

            <input
              type="text"
              placeholder="Enter transaction reference"
              value={reference}
              onChange={e => setReference(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="payments-submit"
            disabled={saving}
          >
            {saving ? "Recording..." : "Record Payment"}
          </button>

        </form>

        {error && (
          <p className="payments-form-error">{error}</p>
        )}

        {success && (
          <p className="payments-form-success">{success}</p>
        )}

      </div>

      {/* TRANSACTION HISTORY */}
      <div className="payments-history">

        <div className="payments-history-header">
          <div>
            <h2>Transaction History</h2>
            <p>All recorded payment transactions</p>
          </div>

          <span className="payments-count">
            {payments.length} Records
          </span>
        </div>

        {loading ? (
          <p className="payments-message">Loading payments...</p>
        ) : error && payments.length === 0 ? (
          <p className="payments-error">{error}</p>
        ) : payments.length === 0 ? (
          <p className="payments-message">No payment records found.</p>
        ) : (

          <div className="payments-table-wrapper">
            <table className="payments-table">

              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Order ID</th>
                  <th>Customer ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Transaction Reference</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {payments.map(payment => (
                  <tr key={payment.payment_id}>
                    <td>#{payment.payment_id}</td>
                    <td>#{payment.order_id}</td>
                    <td>#{payment.payer_customer_id}</td>

                    <td className="payment-amount">
                      ₹{Number(payment.amount).toLocaleString("en-IN")}
                    </td>

                    <td>{payment.payment_method}</td>
                    <td>{payment.payment_channel}</td>

                    <td>
                      <span className={`payment-status ${
                        payment.status === "succeeded"
                          ? "status-success"
                          : payment.status === "failed"
                          ? "status-failed"
                          : "status-pending"
                      }`}>
                        {payment.status}
                      </span>
                    </td>

                    <td>
                      {payment.transaction_reference || "—"}
                    </td>

                    <td>{formatDate(payment.created_at)}</td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

    </div>
  );
}


function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/customers`);

      if (!response.ok) {
        throw new Error("Unable to load customers.");
      }

      setCustomers(await response.json());

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const addCustomer = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to add customer.");
      }

      setSuccess("Customer added successfully!");

      setCustomerName("");
      setEmail("");
      setPhone("");
      setAddress("");

      await loadCustomers();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content customers-page">

      {/* HEADER */}

      {/* SUMMARY */}
      <div className="customers-stats">
        <StatCard
          title="Total Customers"
          value={customers.length}
          icon={Users}
        />
      </div>

      {/* ADD CUSTOMER */}
      <div className="customers-form-panel">
        <h2>Add New Customer</h2>

        <form
          onSubmit={addCustomer}
          className="customers-form-grid"
        >

          <div className="customers-field">
            <label>Customer Name</label>
            <input
              type="text"
              placeholder="Enter customer name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="customers-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="customers-field">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="customers-field">
            <label>Address</label>
            <input
              type="text"
              placeholder="Enter customer address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="customers-submit"
            disabled={saving}
          >
            {saving ? "Adding Customer..." : "Add Customer"}
          </button>

        </form>

        {error && (
          <p className="customers-error">{error}</p>
        )}

        {success && (
          <p className="customers-success">{success}</p>
        )}
      </div>

      {/* CUSTOMER LIST */}
      <div className="customers-list-panel">

        <div className="customers-list-header">
          <div>
            <h2>Customer Directory</h2>
            <p>View and search registered customers.</p>
          </div>

          <span className="customers-count">
            {filteredCustomers.length} Customers
          </span>
        </div>

        <div className="customers-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search by customer name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="customers-message">No customers found.</p>
        ) : (

          <div className="customers-table-wrapper">
            <table className="customers-table">

              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.customer_id}>
                    <td>#{customer.customer_id}</td>
                    <td className="customer-name">
                      {customer.customer_name}
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.address}</td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

    </div>
  );
}


function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");

  const [supplierName, setSupplierName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/suppliers`);

      if (!response.ok) {
        throw new Error("Unable to load suppliers.");
      }

      setSuppliers(await response.json());

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const addSupplier = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/suppliers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          supplier_name: supplierName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to add supplier.");
      }

      setSuccess("Supplier added successfully!");

      setSupplierName("");
      setEmail("");
      setPhone("");
      setAddress("");

      await loadSuppliers();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    (supplier.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content suppliers-page">

      {/* SUMMARY */}
      <div className="suppliers-stats">
        <StatCard
          title="Total Suppliers"
          value={suppliers.length}
          icon={Truck}
        />
      </div>

      {/* ADD SUPPLIER */}
      <div className="suppliers-form-panel">

        <h2>Add New Supplier</h2>

        <form
          onSubmit={addSupplier}
          className="suppliers-form-grid"
        >

          <div className="suppliers-field">
            <label>Supplier Name</label>
            <input
              type="text"
              placeholder="Enter supplier name"
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              required
            />
          </div>

          <div className="suppliers-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="suppliers-field">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="suppliers-field">
            <label>Address</label>
            <input
              type="text"
              placeholder="Enter supplier address"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="suppliers-submit"
            disabled={saving}
          >
            {saving ? "Adding Supplier..." : "Add Supplier"}
          </button>

        </form>

        {error && (
          <p className="suppliers-error">{error}</p>
        )}

        {success && (
          <p className="suppliers-success">{success}</p>
        )}

      </div>

      {/* SUPPLIER DIRECTORY */}
      <div className="suppliers-list-panel">

        <div className="suppliers-list-header">
          <div>
            <h2>Supplier Directory</h2>
            <p>View and search registered suppliers.</p>
          </div>

          <span className="suppliers-count">
            {filteredSuppliers.length} Suppliers
          </span>
        </div>

        {/* SEARCH */}
        <div className="suppliers-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search by supplier name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="suppliers-message">Loading suppliers...</p>
        ) : filteredSuppliers.length === 0 ? (
          <p className="suppliers-message">No suppliers found.</p>
        ) : (

          <div className="suppliers-table-wrapper">

            <table className="suppliers-table">

              <thead>
                <tr>
                  <th>Supplier ID</th>
                  <th>Supplier Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.supplier_id}>
                    <td>#{supplier.supplier_id}</td>

                    <td className="supplier-name">
                      {supplier.supplier_name}
                    </td>

                    <td>{supplier.email || "—"}</td>
                    <td>{supplier.phone || "—"}</td>
                    <td>{supplier.address || "—"}</td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}


function OperationsPage({ page }) {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [godowns, setGodowns] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [purchaseForm, setPurchaseForm] = useState({ supplier_id: "" });
  const [purchaseItems, setPurchaseItems] = useState([{ product_id: "", quantity_ordered: "1", unit_cost: "0" }]);
  const [form, setForm] = useState({});

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.detail || "Request failed.");
    return result;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const paths = {
        "Purchase Orders": "/purchase-orders",
        "Stock Movements": "/stock-movements",
        Refunds: "/refunds",
        Notifications: "/notifications",
        Vehicles: "/vehicles",
        "Delivery Personnel": "/delivery-personnel",
      };
      const data = await request(paths[page]);
      setRows(data);
      if (page === "Purchase Orders") {
        const [p, s, g] = await Promise.all([request("/products"), request("/suppliers"), request("/godowns")]);
        setProducts(p); setSuppliers(s); setGodowns(g);
      } else if (page === "Refunds") {
        setPayments(await request("/payments"));
      }
    } catch (e) {
      setError(e.message || "Could not load data.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      let path = "";
      let body = {};
      if (page === "Purchase Orders") {
        path = "/purchase-orders";
        body = { supplier_id: Number(purchaseForm.supplier_id), items: purchaseItems.map(x => ({ product_id: Number(x.product_id), quantity_ordered: Number(x.quantity_ordered), unit_cost: Number(x.unit_cost) })) };
      } else if (page === "Refunds") {
        path = "/refunds";
        body = { payment_id: Number(form.payment_id), amount: Number(form.amount), reason: form.reason || null };
      } else if (page === "Vehicles") {
        path = "/vehicles";
        body = { registration_number: form.registration_number, vehicle_type: form.vehicle_type, capacity: Number(form.capacity), availability_status: form.availability_status || "available" };
      } else if (page === "Delivery Personnel") {
        path = "/delivery-personnel";
        body = { personnel_name: form.personnel_name, phone: form.phone || null, user_id: form.user_id ? Number(form.user_id) : null, availability_status: form.availability_status || "available" };
      }
      const result = await request(path, { method: "POST", body: JSON.stringify(body) });
      setMessage(result.message || "Saved successfully.");
      setForm({}); setPurchaseForm({ supplier_id: "" });
      setPurchaseItems([{ product_id: "", quantity_ordered: "1", unit_cost: "0" }]);
      await load();
    } catch (e) {
      setError(e.message || "Could not save record.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (path, body) => {
    setError(""); setMessage("");
    try {
      await request(path, { method: "PUT", body: JSON.stringify(body) });
      setMessage("Status updated successfully.");
      await load();
    } catch (e) { setError(e.message || "Could not update status."); }
  };

  const receiveItem = async (orderId, item) => {
    const godownId = form[`godown_${orderId}_${item.purchase_item_id}`];
    if (!godownId) { setError("Select a godown before receiving stock."); return; }
    const remaining = Number(item.quantity_ordered) - Number(item.quantity_received);
    if (remaining <= 0) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const result = await request(`/purchase-orders/${orderId}/receive`, {
        method: "POST",
        body: JSON.stringify({ purchase_item_id: item.purchase_item_id, godown_id: Number(godownId), quantity: remaining, notes: "Purchase order stock received" }),
      });
      setMessage(`Stock received. Purchase order status: ${result.status}.`);
      await load();
    } catch (e) { setError(e.message || "Could not receive stock."); }
    finally { setSaving(false); }
  };

  const filteredRows = rows.filter(row => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  const input = (name, label, type = "text", required = true) => (
    <label className="module-field" key={name}>{label}
      <input type={type} required={required} value={form[name] || ""} onChange={e => setForm(old => ({ ...old, [name]: e.target.value }))} />
    </label>
  );
  const selectField = (name, label, options, required = true) => (
    <label className="module-field" key={name}>{label}
      <select required={required} value={form[name] || ""} onChange={e => setForm(old => ({ ...old, [name]: e.target.value }))}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <div className="operations-page">
      {error && <div className="module-alert error">{error}</div>}
      {message && <div className="module-alert success">{message}</div>}

      {(page === "Purchase Orders" || page === "Refunds" || page === "Vehicles" || page === "Delivery Personnel") && (
        <form className="module-form" onSubmit={submit}>
          <div className="module-section-heading"><div><h3>{page === "Purchase Orders" ? "Create purchase order" : page === "Refunds" ? "Record refund" : page === "Vehicles" ? "Add vehicle" : "Add delivery personnel"}</h3><p>Enter the details below and save the record.</p></div></div>
          {page === "Purchase Orders" && <>
            <div className="module-form-grid">
              <label className="module-field">Supplier<select required value={purchaseForm.supplier_id} onChange={e => setPurchaseForm({ supplier_id: e.target.value })}><option value="">Select supplier</option>{suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}</select></label>
            </div>
            <div className="module-section-heading compact"><h3>Products</h3><button type="button" className="module-secondary-button" onClick={() => setPurchaseItems(old => [...old, { product_id: "", quantity_ordered: "1", unit_cost: "0" }])}>+ Add product</button></div>
            {purchaseItems.map((item, index) => <div className="module-form-grid purchase-item-grid" key={index}>
              <label className="module-field">Product<select required value={item.product_id} onChange={e => setPurchaseItems(old => old.map((x,i) => i === index ? { ...x, product_id: e.target.value } : x))}><option value="">Select product</option>{products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}</select></label>
              <label className="module-field">Quantity<input type="number" min="1" required value={item.quantity_ordered} onChange={e => setPurchaseItems(old => old.map((x,i) => i === index ? { ...x, quantity_ordered: e.target.value } : x))}/></label>
              <label className="module-field">Unit cost<input type="number" min="0" step="0.01" required value={item.unit_cost} onChange={e => setPurchaseItems(old => old.map((x,i) => i === index ? { ...x, unit_cost: e.target.value } : x))}/></label>
              {purchaseItems.length > 1 && <button type="button" className="module-remove-button" onClick={() => setPurchaseItems(old => old.filter((_,i) => i !== index))}>Remove</button>}
            </div>)}
          </>}
          {page === "Refunds" && <div className="module-form-grid">{selectField("payment_id", "Payment", payments.map(p => ({ value: p.payment_id, label: `Payment #${p.payment_id} · Order #${p.order_id} · ₹${p.amount}` })))}{input("amount", "Refund amount", "number")}{input("reason", "Reason", "text", false)}</div>}
          {page === "Vehicles" && <div className="module-form-grid">{input("registration_number", "Registration number")}{input("vehicle_type", "Vehicle type")}{input("capacity", "Capacity", "number")}{selectField("availability_status", "Availability", ["available", "in_use", "maintenance"].map(x => ({ value: x, label: x.replace("_", " ") })))}</div>}
          {page === "Delivery Personnel" && <div className="module-form-grid">{input("personnel_name", "Personnel name")}{input("phone", "Phone", "tel", false)}{input("user_id", "User ID (optional)", "number", false)}{selectField("availability_status", "Availability", ["available", "on_delivery", "unavailable"].map(x => ({ value: x, label: x.replace("_", " ") })))}</div>}
          <button className="module-primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save record"}</button>
        </form>
      )}

      <section className="module-list-panel">
        <div className="module-section-heading">
          <div><h3>{page} {page === "Notifications" ? "centre" : "history"}</h3><p>{rows.length} record(s) · Live database information</p></div>
          <button className="module-secondary-button" onClick={load}>Refresh</button>
        </div>
        {page !== "Notifications" && <input className="module-search" placeholder={`Search ${page.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} />}
        {loading ? <p className="module-empty">Loading records...</p> : filteredRows.length === 0 ? <p className="module-empty">No records found.</p> : (
          <div className="module-table-wrap">
            {page === "Purchase Orders" ? filteredRows.map(order => <div className="purchase-order-card" key={order.purchase_order_id}>
              <div className="purchase-order-head"><div><strong>Purchase Order #{order.purchase_order_id}</strong><span>{order.supplier_name} · {new Date(order.order_date).toLocaleString()}</span></div><div className="module-row-actions"><span className={`module-status ${order.status}`}>{order.status.replaceAll("_", " ")}</span>{order.status === "draft" && <button className="module-small-button" onClick={() => updateStatus(`/purchase-orders/${order.purchase_order_id}/status`, { status: "ordered" })}>Mark ordered</button>}</div></div>
              <table className="module-table"><thead><tr><th>Product</th><th>Ordered</th><th>Received</th><th>Unit cost</th><th>Receive stock</th></tr></thead><tbody>{order.items.map(item => <tr key={item.purchase_item_id}><td>{item.product_name}</td><td>{item.quantity_ordered}</td><td>{item.quantity_received}</td><td>₹{Number(item.unit_cost).toFixed(2)}</td><td>{item.quantity_received < item.quantity_ordered ? <div className="receive-controls"><select value={form[`godown_${order.purchase_order_id}_${item.purchase_item_id}`] || ""} onChange={e => setForm(old => ({ ...old, [`godown_${order.purchase_order_id}_${item.purchase_item_id}`]: e.target.value }))}><option value="">Godown</option>{godowns.map(g => <option key={g.godown_id} value={g.godown_id}>{g.godown_name}</option>)}</select><button className="module-small-button" disabled={saving || order.status === "cancelled"} onClick={() => receiveItem(order.purchase_order_id, item)}>Receive {item.quantity_ordered - item.quantity_received}</button></div> : <span className="module-status received">Complete</span>}</td></tr>)}</tbody></table>
            </div>) : null}
            {page === "Stock Movements" && <table className="module-table"><thead><tr><th>ID</th><th>Product</th><th>Godown</th><th>Type</th><th>Quantity</th><th>Date</th><th>Notes</th></tr></thead><tbody>{filteredRows.map(r => <tr key={r.movement_id}><td>{r.movement_id}</td><td>{r.product_name}</td><td>{r.godown_name}</td><td><span className="module-status">{r.movement_type.replaceAll("_", " ")}</span></td><td>{r.quantity}</td><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.notes || "—"}</td></tr>)}</tbody></table>}
            {page === "Refunds" && <table className="module-table"><thead><tr><th>Refund</th><th>Payment</th><th>Order</th><th>Customer</th><th>Amount</th><th>Reason</th><th>Status</th><th>Update</th></tr></thead><tbody>{filteredRows.map(r => <tr key={r.refund_id}><td>#{r.refund_id}</td><td>#{r.payment_id}</td><td>#{r.order_id}</td><td>{r.customer_name || "—"}</td><td>₹{Number(r.amount).toFixed(2)}</td><td>{r.reason || "—"}</td><td><span className={`module-status ${r.status}`}>{r.status}</span></td><td><select value={r.status} onChange={e => updateStatus(`/refunds/${r.refund_id}/status`, { status: e.target.value })}><option value="pending">pending</option><option value="succeeded">succeeded</option><option value="failed">failed</option></select></td></tr>)}</tbody></table>}
            {page === "Notifications" && <div className="notification-list">{filteredRows.map((r,i) => <div className="notification-row" key={`${r.type}-${i}`}><span className={`notification-mark ${r.severity}`}>{r.type === "low_stock" ? <Boxes size={18}/> : <Bell size={18}/>}</span><div><strong>{r.title}</strong><p>{r.message}</p></div><span className="module-status">{r.type.replace("_", " ")}</span></div>)}</div>}
            {page === "Vehicles" && <table className="module-table"><thead><tr><th>ID</th><th>Registration</th><th>Type</th><th>Capacity</th><th>Availability</th><th>Active</th><th>Update</th></tr></thead><tbody>{filteredRows.map(r => <tr key={r.vehicle_id}><td>{r.vehicle_id}</td><td>{r.registration_number}</td><td>{r.vehicle_type}</td><td>{r.capacity}</td><td><span className="module-status">{r.availability_status.replaceAll("_", " ")}</span></td><td>{r.is_active ? "Yes" : "No"}</td><td><select value={`${r.availability_status}|${r.is_active}`} onChange={e => { const [availability_status, active] = e.target.value.split("|"); updateStatus(`/vehicles/${r.vehicle_id}/status`, { availability_status, is_active: active === "true" }); }}><option value="available|true">Available / Active</option><option value="in_use|true">In use / Active</option><option value="maintenance|true">Maintenance / Active</option><option value="available|false">Inactive</option></select></td></tr>)}</tbody></table>}
            {page === "Delivery Personnel" && <table className="module-table"><thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>User ID</th><th>Availability</th><th>Active</th><th>Update</th></tr></thead><tbody>{filteredRows.map(r => <tr key={r.personnel_id}><td>{r.personnel_id}</td><td>{r.personnel_name}</td><td>{r.phone || "—"}</td><td>{r.user_id || "—"}</td><td><span className="module-status">{r.availability_status.replaceAll("_", " ")}</span></td><td>{r.is_active ? "Yes" : "No"}</td><td><select value={`${r.availability_status}|${r.is_active}`} onChange={e => { const [availability_status, active] = e.target.value.split("|"); updateStatus(`/delivery-personnel/${r.personnel_id}/status`, { availability_status, is_active: active === "true" }); }}><option value="available|true">Available / Active</option><option value="on_delivery|true">On delivery / Active</option><option value="unavailable|true">Unavailable / Active</option><option value="available|false">Inactive</option></select></td></tr>)}</tbody></table>}
          </div>
        )}
      </section>
    </div>
  );
}


export default App;