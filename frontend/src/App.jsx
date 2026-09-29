import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "https://military-asset-management-li79.onrender.com";

function App() {
  // =========================
  // AUTH
  // =========================

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken") || ""
  );

  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken") || ""
  );

  const [currentUser, setCurrentUser] = useState(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  // =========================
  // NAVIGATION
  // =========================

  const [activePage, setActivePage] = useState("dashboard");

  // =========================
  // COMMON DATA
  // =========================

  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const [error, setError] = useState("");

  // =========================
  // DASHBOARD
  // =========================

  const [dashboard, setDashboard] = useState({
    opening_balance: 0,
    purchase_total: 0,
    transfer_in: 0,
    transfer_out: 0,
    net_movement: 0,
    assigned: 0,
    expended: 0,
    closing_balance: 0,
  });

  const [selectedBase, setSelectedBase] = useState("");
  const [selectedEquipmentType, setSelectedEquipmentType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // =========================
  // PURCHASES
  // =========================

  const [purchases, setPurchases] = useState([]);

  const [purchaseForm, setPurchaseForm] = useState({
    base: "",
    equipment_type: "",
    quantity: "",
    purchase_date: "",
    reference: "",
  });

  const [purchaseMessage, setPurchaseMessage] = useState("");

  // =========================
  // TRANSFERS
  // =========================

  const [transfers, setTransfers] = useState([]);

  const [transferForm, setTransferForm] = useState({
    from_base: "",
    to_base: "",
    equipment_type: "",
    quantity: "",
    reference: "",
  });

  const [transferMessage, setTransferMessage] = useState("");

  // =========================
  // ASSIGNMENTS
  // =========================

  const [assignments, setAssignments] = useState([]);

  const [assignmentForm, setAssignmentForm] = useState({
    base: "",
    equipment_type: "",
    personnel_name: "",
    quantity: "",
  });

  const [assignmentMessage, setAssignmentMessage] = useState("");

  // =========================
  // EXPENDITURES
  // =========================

  const [expenditures, setExpenditures] = useState([]);

  const [expenditureForm, setExpenditureForm] = useState({
    base: "",
    equipment_type: "",
    quantity: "",
    reason: "",
  });

  const [expenditureMessage, setExpenditureMessage] = useState("");

  // =========================
  // GET CURRENT USER
  // =========================

  const loadCurrentUser = async (token = accessToken) => {
    if (!token) {
      return null;
    }

    try {
      setUserLoading(true);

      const response = await axios.get(`${API}/api/user/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data;

      setCurrentUser(userData);

      localStorage.setItem("user", JSON.stringify(userData));

      return userData;
    } catch (err) {
      console.error("Could not load current user:", err);

      if (err.response?.status === 401) {
        handleLogout();
      }

      return null;
    } finally {
      setUserLoading(false);
    }
  };

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoginError("");
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API}/api/token/`, {
        username,
        password,
      });

      const access = response.data.access;
      const refresh = response.data.refresh;

      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      setAccessToken(access);
      setRefreshToken(refresh);

      // Get the logged-in user's role and assigned base
      const userResponse = await axios.get(`${API}/api/user/`, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      const userData = userResponse.data;

      setCurrentUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      setUsername("");
      setPassword("");
    } catch (err) {
      console.error("Login error:", err);

      setLoginError("Invalid username or password.");

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      setAccessToken("");
      setRefreshToken("");
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setAccessToken("");
    setRefreshToken("");
    setCurrentUser(null);

    setBases([]);
    setEquipmentTypes([]);
    setPurchases([]);
    setTransfers([]);
    setAssignments([]);
    setExpenditures([]);

    setSelectedBase("");
    setSelectedEquipmentType("");

    setActivePage("dashboard");
    setError("");
  };

  // =========================
  // LOAD BASES
  // =========================

  const loadBases = async (user = currentUser) => {
    try {
      const response = await axios.get(`${API}/api/bases/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      let baseData = response.data;

      // Base Commander can only work with assigned base
      if (user?.role === "COMMANDER") {
        baseData = baseData.filter(
          (base) => base.name === user.base_name
        );
      }

      setBases(baseData);

      // Automatically select the commander's assigned base
      if (user?.role === "COMMANDER" && baseData.length > 0) {
        const commanderBase = baseData[0];

        setSelectedBase(String(commanderBase.id));

        setPurchaseForm((previous) => ({
          ...previous,
          base: String(commanderBase.id),
        }));

        setAssignmentForm((previous) => ({
          ...previous,
          base: String(commanderBase.id),
        }));

        setExpenditureForm((previous) => ({
          ...previous,
          base: String(commanderBase.id),
        }));

        setTransferForm((previous) => ({
          ...previous,
          from_base: String(commanderBase.id),
        }));
      }
    } catch (err) {
      console.error("Could not load bases:", err);

      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  // =========================
  // LOAD EQUIPMENT
  // =========================

  const loadEquipmentTypes = async () => {
    try {
      const response = await axios.get(
        `${API}/api/equipment-types/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setEquipmentTypes(response.data);
    } catch (err) {
      console.error("Could not load equipment types:", err);

      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  // =========================
  // LOAD DASHBOARD
  // =========================

  const loadDashboard = async (
    base = selectedBase,
    equipment = selectedEquipmentType,
    start = startDate,
    end = endDate
  ) => {
    try {
      const params = {};

      if (base) {
        params.base = base;
      }

      if (equipment) {
        params.equipment_type = equipment;
      }

      if (start) {
        params.start_date = start;
      }

      if (end) {
        params.end_date = end;
      }

      const response = await axios.get(`${API}/api/dashboard/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      });

      setDashboard(response.data);
      setError("");
    } catch (err) {
      console.error("Could not load dashboard:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError("Could not load dashboard data.");
    }
  };

  // =========================
  // LOAD PURCHASES
  // =========================

  const loadPurchases = async () => {
    try {
      const response = await axios.get(`${API}/api/purchases/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setPurchases(response.data);
    } catch (err) {
      console.error("Could not load purchases:", err);

      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  // =========================
  // LOAD TRANSFERS
  // =========================

  const loadTransfers = async () => {
    try {
      const response = await axios.get(`${API}/api/transfers/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setTransfers(response.data);
    } catch (err) {
      console.error("Could not load transfers:", err);

      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  // =========================
  // LOAD ASSIGNMENTS
  // =========================

  const loadAssignments = async () => {
    try {
      const response = await axios.get(
        `${API}/api/assignments/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setAssignments(response.data);
    } catch (err) {
      console.error("Could not load assignments:", err);

      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  // =========================
  // LOAD EXPENDITURES
  // =========================

  const loadExpenditures = async () => {
    try {
      const response = await axios.get(
        `${API}/api/expenditures/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setExpenditures(response.data);
    } catch (err) {
      console.error("Could not load expenditures:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError("Could not load expenditure history.");
    }
  };

  // =========================
  // LOAD EVERYTHING
  // =========================

  useEffect(() => {
    const initializeApplication = async () => {
      if (!accessToken) {
        return;
      }

      // First get the authenticated user's role/base.
      const user = await loadCurrentUser(accessToken);

      if (!user) {
        return;
      }

      // Then load the rest of the application data.
      await loadBases(user);
      await loadEquipmentTypes();

      // Commander automatically uses assigned base.
      if (user.role === "COMMANDER") {
        try {
          const baseResponse = await axios.get(
            `${API}/api/bases/`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const commanderBase = baseResponse.data.find(
            (base) => base.name === user.base_name
          );

          if (commanderBase) {
            const commanderBaseId = String(commanderBase.id);

            setSelectedBase(commanderBaseId);

            setPurchaseForm((previous) => ({
              ...previous,
              base: commanderBaseId,
            }));

            setAssignmentForm((previous) => ({
              ...previous,
              base: commanderBaseId,
            }));

            setExpenditureForm((previous) => ({
              ...previous,
              base: commanderBaseId,
            }));

            setTransferForm((previous) => ({
              ...previous,
              from_base: commanderBaseId,
            }));

            await loadDashboard(
              commanderBaseId,
              selectedEquipmentType,
              startDate,
              endDate
            );
          } else {
            await loadDashboard();
          }
        } catch (err) {
          console.error(
            "Could not determine commander base:",
            err
          );

          await loadDashboard();
        }
      } else {
        await loadDashboard();
      }

      await loadPurchases();
      await loadTransfers();
      await loadAssignments();
      await loadExpenditures();
    };

    initializeApplication();
  }, [accessToken]);

  // =========================
  // PURCHASE FORM
  // =========================

  const handlePurchaseChange = (e) => {
    const { name, value } = e.target;

    setPurchaseForm({
      ...purchaseForm,
      [name]: value,
    });
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();

    setPurchaseMessage("");
    setError("");

    try {
      await axios.post(
        `${API}/api/purchases/`,
        {
          base: Number(purchaseForm.base),
          equipment_type: Number(purchaseForm.equipment_type),
          quantity: Number(purchaseForm.quantity),
          purchase_date: purchaseForm.purchase_date,
          reference: purchaseForm.reference,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setPurchaseMessage("Purchase added successfully.");

      setPurchaseForm({
        base:
          currentUser?.role === "COMMANDER"
            ? selectedBase
            : "",
        equipment_type: "",
        quantity: "",
        purchase_date: "",
        reference: "",
      });

      await loadPurchases();

      await loadDashboard(
        selectedBase,
        selectedEquipmentType,
        startDate,
        endDate
      );
    } catch (err) {
      console.error("Purchase error:", err);

      if (err.response?.data) {
        console.error("Server response:", err.response.data);
      }

      setError("Could not add purchase.");
    }
  };

  // =========================
  // TRANSFER FORM
  // =========================

  const handleTransferChange = (e) => {
    const { name, value } = e.target;

    setTransferForm({
      ...transferForm,
      [name]: value,
    });
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();

    setTransferMessage("");
    setError("");

    try {
      await axios.post(
        `${API}/api/transfers/`,
        {
          from_base: Number(transferForm.from_base),
          to_base: Number(transferForm.to_base),
          equipment_type: Number(transferForm.equipment_type),
          quantity: Number(transferForm.quantity),
          reference: transferForm.reference,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setTransferMessage("Transfer created successfully.");

      setTransferForm({
        from_base:
          currentUser?.role === "COMMANDER"
            ? selectedBase
            : "",
        to_base: "",
        equipment_type: "",
        quantity: "",
        reference: "",
      });

      await loadTransfers();

      await loadDashboard(
        selectedBase,
        selectedEquipmentType,
        startDate,
        endDate
      );
    } catch (err) {
      console.error("Transfer error:", err);

      if (err.response?.data) {
        console.error("Server response:", err.response.data);
      }

      setError("Could not create transfer.");
    }
  };

  // =========================
  // ASSIGNMENT FORM
  // =========================

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;

    setAssignmentForm({
      ...assignmentForm,
      [name]: value,
    });
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();

    setAssignmentMessage("");
    setError("");

    try {
      await axios.post(
        `${API}/api/assignments/`,
        {
          base: Number(assignmentForm.base),
          equipment_type: Number(assignmentForm.equipment_type),
          personnel_name: assignmentForm.personnel_name,
          quantity: Number(assignmentForm.quantity),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setAssignmentMessage("Asset assigned successfully.");

      setAssignmentForm({
        base:
          currentUser?.role === "COMMANDER"
            ? selectedBase
            : "",
        equipment_type: "",
        personnel_name: "",
        quantity: "",
      });

      await loadAssignments();

      await loadDashboard(
        selectedBase,
        selectedEquipmentType,
        startDate,
        endDate
      );
    } catch (err) {
      console.error("Assignment error:", err);

      if (err.response?.data) {
        console.error("Server response:", err.response.data);
      }

      setError("Could not create assignment.");
    }
  };

  // =========================
  // EXPENDITURE FORM
  // =========================

  const handleExpenditureChange = (e) => {
    const { name, value } = e.target;

    setExpenditureForm({
      ...expenditureForm,
      [name]: value,
    });
  };

  const handleExpenditureSubmit = async (e) => {
    e.preventDefault();

    setExpenditureMessage("");
    setError("");

    try {
      await axios.post(
        `${API}/api/expenditures/`,
        {
          base: Number(expenditureForm.base),
          equipment_type: Number(expenditureForm.equipment_type),
          quantity: Number(expenditureForm.quantity),
          reason: expenditureForm.reason,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setExpenditureMessage(
        "Expenditure added successfully."
      );

      setExpenditureForm({
        base:
          currentUser?.role === "COMMANDER"
            ? selectedBase
            : "",
        equipment_type: "",
        quantity: "",
        reason: "",
      });

      await loadExpenditures();

      await loadDashboard(
        selectedBase,
        selectedEquipmentType,
        startDate,
        endDate
      );
    } catch (err) {
      console.error("Expenditure error:", err);

      if (err.response?.data) {
        console.error("Server response:", err.response.data);
      }

      setError("Could not add expenditure.");
    }
  };

  // =========================
  // DASHBOARD FILTER
  // =========================

  const handleDashboardFilter = () => {
    loadDashboard(
      selectedBase,
      selectedEquipmentType,
      startDate,
      endDate
    );
  };

  // =========================
  // HELPER FUNCTIONS
  // =========================

  const getBaseName = (id) => {
    const base = bases.find(
      (item) => Number(item.id) === Number(id)
    );

    return base ? base.name : `Base #${id}`;
  };

  const getEquipmentName = (id) => {
    const equipment = equipmentTypes.find(
      (item) => Number(item.id) === Number(id)
    );

    return equipment
      ? equipment.name
      : `Equipment #${id}`;
  };

  // =========================
  // LOGIN PAGE
  // =========================

  if (!accessToken) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Military Asset Management</h1>

          <p className="login-subtitle">
            Secure Asset Management System
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Enter username"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter password"
                required
              />
            </div>

            {loginError && (
              <div className="error-box">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="primary-button login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================
  // MAIN APPLICATION
  // =========================

  return (
    <div className="app">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="sidebar">

        <div className="sidebar-header">
          <h2>Military AMS</h2>
          <p>Asset Management</p>
        </div>

        <nav className="sidebar-nav">

          <button
            className={
              activePage === "dashboard"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={
              activePage === "purchases"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => setActivePage("purchases")}
          >
            Purchases
          </button>

          <button
            className={
              activePage === "transfers"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => setActivePage("transfers")}
          >
            Transfers
          </button>

          <button
            className={
              activePage === "assignments"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => setActivePage("assignments")}
          >
            Assignments
          </button>

          <button
            className={
              activePage === "expenditures"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => setActivePage("expenditures")}
          >
            Expenditures
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div className="main-content">

        {/* TOP BAR */}

        <header className="topbar">

          <div>
            <h1>
              {activePage === "dashboard" &&
                "Dashboard"}

              {activePage === "purchases" &&
                "Purchases"}

              {activePage === "transfers" &&
                "Transfers"}

              {activePage === "assignments" &&
                "Assignments"}

              {activePage === "expenditures" &&
                "Expenditures"}
            </h1>

            <p>
              Military Asset Management System
            </p>
          </div>

          <div className="user-info">
            <span>
              Logged in
              {currentUser?.username
                ? ` as ${currentUser.username}`
                : ""}
            </span>
          </div>

        </header>

        {/* ERROR */}

        {error && (
          <div className="error-box global-error">
            {error}

            <button
              onClick={() => setError("")}
              className="close-error"
            >
              ×
            </button>
          </div>
        )}

        {/* USER LOADING */}

        {userLoading && !currentUser ? (
          <main className="page-container">
            <section className="welcome-section">
              <h2>Loading...</h2>
              <p>
                Loading your account and permissions.
              </p>
            </section>
          </main>
        ) : (
          <>
            {/* =========================
                DASHBOARD
            ========================= */}

            {activePage === "dashboard" && (
              <main className="page-container">

                <section className="welcome-section">
                  <h2>Asset Overview</h2>

                  <p>
                    Monitor military equipment balances,
                    movements, assignments and expenditures.
                  </p>
                </section>

                {/* FILTERS */}

                <section className="filter-card">

                  <h3>Dashboard Filters</h3>

                  <div className="filter-grid">

                    <div className="form-group">
                      <label>Base</label>

                      <select
                        value={selectedBase}
                        onChange={(e) =>
                          setSelectedBase(e.target.value)
                        }
                      >
                        <option value="">
                          {currentUser?.role === "COMMANDER"
                            ? "Select Base"
                            : "All Bases"}
                        </option>

                        {bases.map((base) => (
                          <option
                            key={base.id}
                            value={base.id}
                          >
                            {base.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Equipment Type</label>

                      <select
                        value={selectedEquipmentType}
                        onChange={(e) =>
                          setSelectedEquipmentType(
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          All Equipment
                        </option>

                        {equipmentTypes.map(
                          (equipment) => (
                            <option
                              key={equipment.id}
                              value={equipment.id}
                            >
                              {equipment.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Start Date</label>

                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) =>
                          setStartDate(e.target.value)
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>End Date</label>

                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) =>
                          setEndDate(e.target.value)
                        }
                      />
                    </div>

                  </div>

                  <button
                    className="primary-button"
                    onClick={handleDashboardFilter}
                  >
                    Apply Filters
                  </button>

                </section>

                {/* METRICS */}

                <section className="metrics-grid">

                  <div className="metric-card">
                    <h3>Opening Balance</h3>
                    <strong>
                      {dashboard.opening_balance}
                    </strong>
                  </div>

                  <div className="metric-card">
                    <h3>Purchases</h3>
                    <strong>
                      {dashboard.purchase_total}
                    </strong>
                  </div>

                  <div className="metric-card">
                    <h3>Transfer In</h3>
                    <strong>
                      {dashboard.transfer_in}
                    </strong>
                  </div>

                  <div className="metric-card">
                    <h3>Transfer Out</h3>
                    <strong>
                      {dashboard.transfer_out}
                    </strong>
                  </div>

                  <div className="metric-card">
                    <h3>Net Movement</h3>
                    <strong>
                      {dashboard.net_movement}
                    </strong>
                  </div>

                  <div className="metric-card">
                    <h3>Assigned</h3>
                    <strong>
                      {dashboard.assigned}
                    </strong>
                  </div>

                  <div className="metric-card">
                    <h3>Expended</h3>
                    <strong>
                      {dashboard.expended}
                    </strong>
                  </div>

                  <div className="metric-card highlight">
                    <h3>Closing Balance</h3>
                    <strong>
                      {dashboard.closing_balance}
                    </strong>
                  </div>

                </section>

                {/* NET MOVEMENT BREAKDOWN */}

                <section className="table-card">

                  <h3>Net Movement Breakdown</h3>

                  <div className="movement-grid">

                    <div>
                      <span>Purchases</span>
                      <strong>
                        +{dashboard.purchase_total}
                      </strong>
                    </div>

                    <div>
                      <span>Transfer In</span>
                      <strong>
                        +{dashboard.transfer_in}
                      </strong>
                    </div>

                    <div>
                      <span>Transfer Out</span>
                      <strong>
                        -{dashboard.transfer_out}
                      </strong>
                    </div>

                    <div>
                      <span>Net Movement</span>
                      <strong>
                        {dashboard.net_movement}
                      </strong>
                    </div>

                  </div>

                </section>

              </main>
            )}

            {/* =========================
                PURCHASES
            ========================= */}

            {activePage === "purchases" && (
              <main className="page-container">

                <section className="welcome-section">
                  <h2>Purchases</h2>

                  <p>
                    Record and view historical equipment
                    purchases.
                  </p>
                </section>

                {purchaseMessage && (
                  <div className="success-box">
                    {purchaseMessage}
                  </div>
                )}

                <section className="form-card">

                  <h3>Create Purchase</h3>

                  <form
                    onSubmit={handlePurchaseSubmit}
                  >

                    <div className="form-grid">

                      <div className="form-group">
                        <label>Base</label>

                        <select
                          name="base"
                          value={purchaseForm.base}
                          onChange={handlePurchaseChange}
                          required
                        >
                          <option value="">
                            Select Base
                          </option>

                          {bases.map((base) => (
                            <option
                              key={base.id}
                              value={base.id}
                            >
                              {base.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Equipment Type</label>

                        <select
                          name="equipment_type"
                          value={
                            purchaseForm.equipment_type
                          }
                          onChange={handlePurchaseChange}
                          required
                        >
                          <option value="">
                            Select Equipment
                          </option>

                          {equipmentTypes.map(
                            (equipment) => (
                              <option
                                key={equipment.id}
                                value={equipment.id}
                              >
                                {equipment.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Quantity</label>

                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          value={purchaseForm.quantity}
                          onChange={handlePurchaseChange}
                          placeholder="Enter quantity"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Purchase Date</label>

                        <input
                          type="date"
                          name="purchase_date"
                          value={
                            purchaseForm.purchase_date
                          }
                          onChange={handlePurchaseChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Reference</label>

                        <input
                          type="text"
                          name="reference"
                          value={purchaseForm.reference}
                          onChange={handlePurchaseChange}
                          placeholder="PO-001"
                        />
                      </div>

                    </div>

                    <button
                      type="submit"
                      className="primary-button"
                    >
                      Create Purchase
                    </button>

                  </form>

                </section>

                <section className="table-card">

                  <div className="table-header">

                    <div>
                      <h3>Purchase History</h3>
                      <p>
                        Historical equipment purchases
                      </p>
                    </div>

                    <button
                      onClick={loadPurchases}
                      className="secondary-button"
                    >
                      Refresh
                    </button>

                  </div>

                  {purchases.length === 0 ? (
                    <p className="empty-message">
                      No purchase records found.
                    </p>
                  ) : (
                    <div className="table-wrapper">

                      <table>

                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Base</th>
                            <th>Equipment</th>
                            <th>Quantity</th>
                            <th>Purchase Date</th>
                            <th>Reference</th>
                          </tr>
                        </thead>

                        <tbody>

                          {purchases.map(
                            (purchase) => (
                              <tr key={purchase.id}>

                                <td>
                                  {purchase.id}
                                </td>

                                <td>
                                  {getBaseName(
                                    purchase.base
                                  )}
                                </td>

                                <td>
                                  {getEquipmentName(
                                    purchase.equipment_type
                                  )}
                                </td>

                                <td>
                                  {purchase.quantity}
                                </td>

                                <td>
                                  {purchase.purchase_date}
                                </td>

                                <td>
                                  {purchase.reference ||
                                    "-"}
                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </section>

              </main>
            )}

            {/* =========================
                TRANSFERS
            ========================= */}

            {activePage === "transfers" && (
              <main className="page-container">

                <section className="welcome-section">
                  <h2>Transfers</h2>

                  <p>
                    Transfer equipment between military
                    bases and track movement history.
                  </p>
                </section>

                {transferMessage && (
                  <div className="success-box">
                    {transferMessage}
                  </div>
                )}

                <section className="form-card">

                  <h3>Create Transfer</h3>

                  <form
                    onSubmit={handleTransferSubmit}
                  >

                    <div className="form-grid">

                      <div className="form-group">
                        <label>From Base</label>

                        <select
                          name="from_base"
                          value={transferForm.from_base}
                          onChange={handleTransferChange}
                          required
                        >
                          <option value="">
                            Select Source Base
                          </option>

                          {bases.map((base) => (
                            <option
                              key={base.id}
                              value={base.id}
                            >
                              {base.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>To Base</label>

                        <select
                          name="to_base"
                          value={transferForm.to_base}
                          onChange={handleTransferChange}
                          required
                        >
                          <option value="">
                            Select Destination Base
                          </option>

                          {bases.map((base) => (
                            <option
                              key={base.id}
                              value={base.id}
                            >
                              {base.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Equipment Type</label>

                        <select
                          name="equipment_type"
                          value={
                            transferForm.equipment_type
                          }
                          onChange={handleTransferChange}
                          required
                        >
                          <option value="">
                            Select Equipment
                          </option>

                          {equipmentTypes.map(
                            (equipment) => (
                              <option
                                key={equipment.id}
                                value={equipment.id}
                              >
                                {equipment.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Quantity</label>

                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          value={transferForm.quantity}
                          onChange={handleTransferChange}
                          placeholder="Enter quantity"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Reference</label>

                        <input
                          type="text"
                          name="reference"
                          value={transferForm.reference}
                          onChange={handleTransferChange}
                          placeholder="TR-001"
                        />
                      </div>

                    </div>

                    <button
                      type="submit"
                      className="primary-button"
                    >
                      Create Transfer
                    </button>

                  </form>

                </section>

                <section className="table-card">

                  <div className="table-header">

                    <div>
                      <h3>Transfer History</h3>

                      <p>
                        Equipment movement between bases
                      </p>
                    </div>

                    <button
                      onClick={loadTransfers}
                      className="secondary-button"
                    >
                      Refresh
                    </button>

                  </div>

                  {transfers.length === 0 ? (
                    <p className="empty-message">
                      No transfer records found.
                    </p>
                  ) : (
                    <div className="table-wrapper">

                      <table>

                        <thead>

                          <tr>
                            <th>ID</th>
                            <th>From Base</th>
                            <th>To Base</th>
                            <th>Equipment</th>
                            <th>Quantity</th>
                            <th>Date</th>
                            <th>Reference</th>
                          </tr>

                        </thead>

                        <tbody>

                          {transfers.map(
                            (transfer) => (
                              <tr key={transfer.id}>

                                <td>
                                  {transfer.id}
                                </td>

                                <td>
                                  {getBaseName(
                                    transfer.from_base
                                  )}
                                </td>

                                <td>
                                  {getBaseName(
                                    transfer.to_base
                                  )}
                                </td>

                                <td>
                                  {getEquipmentName(
                                    transfer.equipment_type
                                  )}
                                </td>

                                <td>
                                  {transfer.quantity}
                                </td>

                                <td>
                                  {transfer.transfer_date
                                    ? new Date(
                                        transfer.transfer_date
                                      ).toLocaleString()
                                    : "-"}
                                </td>

                                <td>
                                  {transfer.reference ||
                                    "-"}
                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </section>

              </main>
            )}

            {/* =========================
                ASSIGNMENTS
            ========================= */}

            {activePage === "assignments" && (
              <main className="page-container">

                <section className="welcome-section">
                  <h2>Assignments</h2>

                  <p>
                    Assign military equipment to personnel.
                  </p>
                </section>

                {assignmentMessage && (
                  <div className="success-box">
                    {assignmentMessage}
                  </div>
                )}

                <section className="form-card">

                  <h3>Create Assignment</h3>

                  <form
                    onSubmit={handleAssignmentSubmit}
                  >

                    <div className="form-grid">

                      <div className="form-group">
                        <label>Base</label>

                        <select
                          name="base"
                          value={assignmentForm.base}
                          onChange={handleAssignmentChange}
                          required
                        >
                          <option value="">
                            Select Base
                          </option>

                          {bases.map((base) => (
                            <option
                              key={base.id}
                              value={base.id}
                            >
                              {base.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Equipment Type</label>

                        <select
                          name="equipment_type"
                          value={
                            assignmentForm.equipment_type
                          }
                          onChange={handleAssignmentChange}
                          required
                        >
                          <option value="">
                            Select Equipment
                          </option>

                          {equipmentTypes.map(
                            (equipment) => (
                              <option
                                key={equipment.id}
                                value={equipment.id}
                              >
                                {equipment.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Personnel Name</label>

                        <input
                          type="text"
                          name="personnel_name"
                          value={
                            assignmentForm.personnel_name
                          }
                          onChange={handleAssignmentChange}
                          placeholder="Enter personnel name"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Quantity</label>

                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          value={assignmentForm.quantity}
                          onChange={handleAssignmentChange}
                          placeholder="Enter quantity"
                          required
                        />
                      </div>

                    </div>

                    <button
                      type="submit"
                      className="primary-button"
                    >
                      Assign Equipment
                    </button>

                  </form>

                </section>

                <section className="table-card">

                  <div className="table-header">

                    <div>
                      <h3>Assignment History</h3>

                      <p>
                        Equipment assigned to personnel
                      </p>
                    </div>

                    <button
                      onClick={loadAssignments}
                      className="secondary-button"
                    >
                      Refresh
                    </button>

                  </div>

                  {assignments.length === 0 ? (
                    <p className="empty-message">
                      No assignment records found.
                    </p>
                  ) : (
                    <div className="table-wrapper">

                      <table>

                        <thead>

                          <tr>
                            <th>ID</th>
                            <th>Base</th>
                            <th>Equipment</th>
                            <th>Personnel</th>
                            <th>Quantity</th>
                            <th>Date</th>
                          </tr>

                        </thead>

                        <tbody>

                          {assignments.map(
                            (assignment) => (
                              <tr
                                key={assignment.id}
                              >

                                <td>
                                  {assignment.id}
                                </td>

                                <td>
                                  {getBaseName(
                                    assignment.base
                                  )}
                                </td>

                                <td>
                                  {getEquipmentName(
                                    assignment.equipment_type
                                  )}
                                </td>

                                <td>
                                  {
                                    assignment.personnel_name
                                  }
                                </td>

                                <td>
                                  {assignment.quantity}
                                </td>

                                <td>
                                  {assignment.assignment_date
                                    ? new Date(
                                        assignment.assignment_date
                                      ).toLocaleString()
                                    : "-"}
                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </section>

              </main>
            )}

            {/* =========================
                EXPENDITURES
            ========================= */}

            {activePage === "expenditures" && (
              <main className="page-container">

                <section className="welcome-section">

                  <h2>Expenditures</h2>

                  <p>
                    Record and view expended military
                    equipment.
                  </p>

                </section>

                {expenditureMessage && (
                  <div className="success-box">
                    {expenditureMessage}
                  </div>
                )}

                <section className="form-card">

                  <h3>Create Expenditure</h3>

                  <form
                    onSubmit={handleExpenditureSubmit}
                  >

                    <div className="form-grid">

                      <div className="form-group">

                        <label>Base</label>

                        <select
                          name="base"
                          value={expenditureForm.base}
                          onChange={handleExpenditureChange}
                          required
                        >

                          <option value="">
                            Select Base
                          </option>

                          {bases.map((base) => (
                            <option
                              key={base.id}
                              value={base.id}
                            >
                              {base.name}
                            </option>
                          ))}

                        </select>

                      </div>

                      <div className="form-group">

                        <label>Equipment Type</label>

                        <select
                          name="equipment_type"
                          value={
                            expenditureForm.equipment_type
                          }
                          onChange={handleExpenditureChange}
                          required
                        >

                          <option value="">
                            Select Equipment
                          </option>

                          {equipmentTypes.map(
                            (equipment) => (
                              <option
                                key={equipment.id}
                                value={equipment.id}
                              >
                                {equipment.name}
                              </option>
                            )
                          )}

                        </select>

                      </div>

                      <div className="form-group">

                        <label>Quantity</label>

                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          value={
                            expenditureForm.quantity
                          }
                          onChange={
                            handleExpenditureChange
                          }
                          placeholder="Enter quantity"
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>Reason</label>

                        <input
                          type="text"
                          name="reason"
                          value={expenditureForm.reason}
                          onChange={
                            handleExpenditureChange
                          }
                          placeholder="Example: Training exercise"
                        />

                      </div>

                    </div>

                    <button
                      type="submit"
                      className="primary-button"
                    >
                      Create Expenditure
                    </button>

                  </form>

                </section>

                <section className="table-card">

                  <div className="table-header">

                    <div>

                      <h3>Expenditure History</h3>

                      <p>
                        Historical asset expenditure
                        records
                      </p>

                    </div>

                    <button
                      onClick={loadExpenditures}
                      className="secondary-button"
                    >
                      Refresh
                    </button>

                  </div>

                  {expenditures.length === 0 ? (
                    <p className="empty-message">
                      No expenditure records found.
                    </p>
                  ) : (
                    <div className="table-wrapper">

                      <table>

                        <thead>

                          <tr>
                            <th>ID</th>
                            <th>Base</th>
                            <th>Equipment</th>
                            <th>Quantity</th>
                            <th>Expenditure Date</th>
                            <th>Reason</th>
                          </tr>

                        </thead>

                        <tbody>

                          {expenditures.map(
                            (expenditure) => (
                              <tr
                                key={expenditure.id}
                              >

                                <td>
                                  {expenditure.id}
                                </td>

                                <td>
                                  {getBaseName(
                                    expenditure.base
                                  )}
                                </td>

                                <td>
                                  {getEquipmentName(
                                    expenditure.equipment_type
                                  )}
                                </td>

                                <td>
                                  {expenditure.quantity}
                                </td>

                                <td>
                                  {expenditure.expenditure_date
                                    ? new Date(
                                        expenditure.expenditure_date
                                      ).toLocaleString()
                                    : "-"}
                                </td>

                                <td>
                                  {expenditure.reason ||
                                    "-"}
                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </table>

                    </div>
                  )}

                </section>

              </main>
            )}

          </>
        )}

      </div>

    </div>
  );
}

export default App;