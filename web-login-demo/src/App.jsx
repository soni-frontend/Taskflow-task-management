import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "https://taskflow-task-management-3qb5.onrender.com";

const EMPTY_TASK = {
  title: "",
  description: "",
  date: "",
  time: "",
  priority: "Medium",
  category: "Work",
};

function normalizeTask(task) {
  return {
    ...task,
    id: task._id,
    createdAt: new Date(task.createdAt).getTime(),
    completedAt: task.completedAt
      ? new Date(task.completedAt).toLocaleString("en-IN")
      : null,
  };
}

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  const [profileData, setProfileData] = useState({
  name: "",
  description: "",
  profilePicture: "",
});

const [editingProfile, setEditingProfile] = useState(false);
const [savingProfile, setSavingProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [forgotData, setForgotData] = useState({
    email: "",
    newPassword: "",
  });

  const [taskData, setTaskData] = useState(EMPTY_TASK);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [notifications, setNotifications] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Notifications
  const addNotification = (message, type = "info") => {
    setNotifications((previous) => [
      {
        id: Date.now() + Math.random(),
        message,
        type,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...previous,
    ]);
  };

  const clearNotifications = () => setNotifications([]);

  // Load tasks from MongoDB
  const loadTasks = async (email) => {
    setLoadingTasks(true);

    try {
      const response = await fetch(
        `${API}/tasks/${encodeURIComponent(email)}`
      );

      console.log("Loading tasks for:", email);
     console.log("Tasks API status:", response.status);

      const data = await response.json();
     console.log("Tasks API response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Could not load tasks");
      }

      setTasks(data.map(normalizeTask));
      return true;
    } catch (error) {
      console.error("Load tasks error:", error);
      alert("Login successful, but tasks could not be loaded. Check the backend.");
      return false;
    } finally {
      setLoadingTasks(false);
    }
  };

// Load profile from MongoDB
const loadProfile = async (email) => {
  try {
    const response = await fetch(
      `${API}/profile/${encodeURIComponent(email)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load profile");
    }

    setProfileData({
      name: data.name || "",
      description: data.description || "",
      profilePicture: data.profilePicture || "",
    });

    setUser((previous) => ({
      ...previous,
      ...data,
    }));
  } catch (error) {
    console.error("Load profile error:", error);
  }
};


// Save profile to MongoDB
const handleProfileSave = async (event) => {
  event.preventDefault();

  if (!profileData.name.trim()) {
    alert("Please enter your name.");
    return;
  }

  setSavingProfile(true);

  try {
    const response = await fetch(
      `${API}/profile/${encodeURIComponent(user.email)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileData.name,
          description: profileData.description,
          profilePicture: profileData.profilePicture,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not save profile");
    }

    setUser((previous) => ({
      ...previous,
      ...data.user,
    }));

    setProfileData({
      name: data.user.name || "",
      description: data.user.description || "",
      profilePicture: data.user.profilePicture || "",
    });

    setEditingProfile(false);

    alert("Profile updated successfully!");
  } catch (error) {
    console.error("Save profile error:", error);
    alert(error.message || "Could not save profile.");
  } finally {
    setSavingProfile(false);
  }
};



  // Login
  const handleLogin = async (event) => {

    event.preventDefault();

    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      const loggedInUser = data.user;

      setUser(loggedInUser);
      setTasks([]);
      setNotifications([]);
      setLoginData({ email: "", password: "" });

      const loaded = await loadTasks(loggedInUser.email);

      if (loaded) {
  await loadProfile(loggedInUser.email);
}

      if (loaded) {
        setPage("dashboard");
      } else {
        setUser(null);
        setPage("login");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Server is not running. Please start the backend.");
    }
  };

  // Signup
  const handleSignup = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Signup failed");
        return;
      }

      alert("Signup successful! Please login.");

      setSignupData({ name: "", email: "", password: "" });
      setPage("login");
    } catch (error) {
      console.error("Signup error:", error);
      alert("Server is not running.");
    }
  };

  // Forgot password
  const handleForgotPassword = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forgotData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Password reset failed");
        return;
      }

      alert(data.message || "Password reset successful");

      setForgotData({ email: "", newPassword: "" });
      setPage("login");
    } catch (error) {
      console.error("Password reset error:", error);
      alert("Server is not running.");
    }
  };

  const resetTaskForm = () => {
    setTaskData(EMPTY_TASK);
    setEditingId(null);
  };

  // Add or update task in MongoDB
  const handleTaskSubmit = async (event) => {
    event.preventDefault();

    if (!taskData.title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    try {
      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `${API}/tasks/${editingId}`
          : `${API}/tasks`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: user.email,
            ...taskData,
            title: taskData.title.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not save task");
        return;
      }

      const savedTask = normalizeTask(data.task);

      if (isEditing) {
        setTasks((previous) =>
          previous.map((task) =>
            task.id === editingId ? savedTask : task
          )
        );

        addNotification(`"${savedTask.title}" updated successfully.`);
      } else {
        setTasks((previous) => [savedTask, ...previous]);

        addNotification(
          `"${savedTask.title}" added successfully.`,
          "success"
        );
      }

      resetTaskForm();
    } catch (error) {
      console.error("Save task error:", error);
      alert("Could not connect to the backend.");
    }
  };

  // Edit task
  const handleEdit = (task) => {
    setTaskData({
      title: task.title || "",
      description: task.description || "",
      date: task.date || "",
      time: task.time || "",
      priority: task.priority || "Medium",
      category: task.category || "Work",
    });

    setEditingId(task.id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete task from MongoDB
  const handleDelete = async (id) => {
    const task = tasks.find((item) => item.id === id);

    if (!task || !window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/tasks/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not delete task");
        return;
      }

      setTasks((previous) => previous.filter((item) => item.id !== id));

      if (editingId === id) resetTaskForm();

      addNotification(`"${task.title}" deleted.`, "delete");
    } catch (error) {
      console.error("Delete task error:", error);
      alert("Could not connect to the backend.");
    }
  };

  // Complete or reopen task
  const handleComplete = async (id) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const completed = !task.completed;

    try {
      const response = await fetch(`${API}/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          completed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not update task");
        return;
      }

      const updatedTask = normalizeTask(data.task);

      setTasks((previous) =>
        previous.map((item) => (item.id === id ? updatedTask : item))
      );

      addNotification(
        completed
          ? `"${task.title}" marked completed.`
          : `"${task.title}" moved to pending.`,
        completed ? "success" : "warning"
      );
    } catch (error) {
      console.error("Complete task error:", error);
      alert("Could not connect to the backend.");
    }
  };

  // Clear completed tasks from MongoDB
  const clearCompleted = async () => {
    const completedList = tasks.filter((task) => task.completed);

    if (completedList.length === 0) return;

    const confirmed = window.confirm(
      `Delete all ${completedList.length} completed tasks?`
    );

    if (!confirmed) return;

    const results = await Promise.all(
      completedList.map(async (task) => {
        try {
          const response = await fetch(`${API}/tasks/${task.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userEmail: user.email }),
          });

          return response.ok ? task.id : null;
        } catch {
          return null;
        }
      })
    );

    const deletedIds = results.filter(Boolean);

    setTasks((previous) =>
      previous.filter((task) => !deletedIds.includes(task.id))
    );

    if (editingId && deletedIds.includes(editingId)) {
      resetTaskForm();
    }

    if (deletedIds.length > 0) {
      addNotification(`${deletedIds.length} completed task(s) cleared.`);
    }

    if (deletedIds.length < completedList.length) {
      alert("Some tasks could not be deleted. Please try again.");
    }
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    setTasks([]);
    setPage("login");
    setActivePanel(null);
    setNotifications([]);
    resetTaskForm();
    setLoginData({ email: "", password: "" });
  };

  // Today's date
  const today = [
    currentTime.getFullYear(),
    String(currentTime.getMonth() + 1).padStart(2, "0"),
    String(currentTime.getDate()).padStart(2, "0"),
  ].join("-");

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  const overdueTasks = tasks.filter(
    (task) => !task.completed && task.date && task.date < today
  ).length;

  const todayTasks = tasks.filter((task) => task.date === today).length;

  const todayPendingTasks = tasks.filter(
    (task) => !task.completed && task.date === today
  );

  const upcomingTasks = tasks.filter(
    (task) => !task.completed && task.date && task.date > today
  ).length;

  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const dateNotifications = useMemo(() => {
    const alerts = [];

    tasks.forEach((task) => {
      if (task.completed || !task.date) return;

      if (task.date < today) {
        alerts.push({
          id: `overdue-${task.id}`,
          message: `"${task.title}" is overdue.`,
          type: "overdue",
          time: "Deadline passed",
        });
      } else if (task.date === today) {
        alerts.push({
          id: `today-${task.id}`,
          message: `"${task.title}" is due today.`,
          type: "warning",
          time: "Today",
        });
      }
    });

    return alerts;
  }, [tasks, today]);

  const allNotifications = [...notifications, ...dateNotifications];

  const filteredTasks = tasks
    .filter((task) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        (task.title || "").toLowerCase().includes(searchText) ||
        (task.description || "").toLowerCase().includes(searchText);

      const matchesStatus =
        filter === "all"
          ? true
          : filter === "completed"
            ? task.completed
            : !task.completed;

      const matchesCategory =
        categoryFilter === "all" || task.category === categoryFilter;

      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesPriority
      );
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return a.createdAt - b.createdAt;

      if (sortBy === "due") {
        return (
          new Date(a.date || "9999-12-31") -
          new Date(b.date || "9999-12-31")
        );
      }

      return b.createdAt - a.createdAt;
    });

  // Login / Signup / Forgot Password pages
  if (page !== "dashboard" || !user) {
    return (
      <div className={`app ${darkMode ? "dark-mode" : ""}`}>
        <div className="container">
          <button
            className="theme-toggle login-theme"
            type="button"
            onClick={() => setDarkMode((previous) => !previous)}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>

          <div className="card">
            <div className="login-brand">
              <span>WEB DEVELOPMENT</span>
              <h1>Web Login Demo</h1>
              <p>Secure account access &amp; task management</p>
            </div>

            {page === "login" && (
              <form onSubmit={handleLogin}>
                <h2 className="welcome-heading">Welcome Back</h2>

                <input
                  type="email"
                  placeholder="Email address"
                  value={loginData.email}
                  onChange={(event) =>
                    setLoginData({ ...loginData, email: event.target.value })
                  }
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(event) =>
                    setLoginData({ ...loginData, password: event.target.value })
                  }
                  required
                />

                <button type="submit" disabled={loadingTasks}>
                  {loadingTasks ? "Loading..." : "Login"}
                </button>

                <p>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setPage("forgot")}
                  >
                    Forgot Password?
                  </button>
                </p>

                <p>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setPage("signup")}
                  >
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {page === "signup" && (
              <form onSubmit={handleSignup}>
                <h2>Create Account</h2>

                <input
                  type="text"
                  placeholder="Full name"
                  value={signupData.name}
                  onChange={(event) =>
                    setSignupData({ ...signupData, name: event.target.value })
                  }
                  required
                />

                <input
                  type="email"
                  placeholder="Email address"
                  value={signupData.email}
                  onChange={(event) =>
                    setSignupData({ ...signupData, email: event.target.value })
                  }
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={signupData.password}
                  onChange={(event) =>
                    setSignupData({
                      ...signupData,
                      password: event.target.value,
                    })
                  }
                  required
                />

                <button type="submit">Create Account</button>

                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setPage("login")}
                  >
                    Login
                  </button>
                </p>
              </form>
            )}

            {page === "forgot" && (
              <form onSubmit={handleForgotPassword}>
                <h2>Reset Password</h2>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotData.email}
                  onChange={(event) =>
                    setForgotData({ ...forgotData, email: event.target.value })
                  }
                  required
                />

                <input
                  type="password"
                  placeholder="New password"
                  value={forgotData.newPassword}
                  onChange={(event) =>
                    setForgotData({
                      ...forgotData,
                      newPassword: event.target.value,
                    })
                  }
                  required
                />

                <button type="submit">Reset Password</button>

                <p>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setPage("login")}
                  >
                    Back to Login
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className={`app ${darkMode ? "dark-mode" : ""}`}>
      <div className="dashboard-container">
        <div className="dashboard-card">
        <div className="top-bar">
  <div className="user-info-area profile-info text-center">
    <span className="dashboard-label">TASK MANAGEMENT</span>
    <h3>My Dashboard</h3>
    <p>
      Welcome back, <strong>{user.name}</strong> 👋
    </p>
    <small>{user.email}</small>
  </div>

 <div className="top-actions">
  {/* Current Time */}
  <div className="header-info-box live-clock">
    <span>🕒 Current Time</span>
    <strong>
      {currentTime.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </strong>
  </div>

  {/* Date */}
  <div className="header-info-box header-date">
    <span>📅 Today</span>
    <strong>
      {currentTime.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}
    </strong>
  </div>

  {/* Notifications */}
  <button
    className="header-control notification-control"
    type="button"
    title="Notifications"
    onClick={() =>
      setActivePanel(
        activePanel === "notifications" ? null : "notifications"
      )
    }
  >
    🔔
    {allNotifications.length > 0 && (
      <span className="notification-count">
        {allNotifications.length > 9 ? "9+" : allNotifications.length}
      </span>
    )}
  </button>

  {/* Dark Mode */}
  <button
    className="header-control"
    type="button"
    onClick={() => setDarkMode((previous) => !previous)}
  >
    {darkMode ? "☀️ Light" : "🌙 Dark"}
  </button>

  {/* Profile */}
  <button
    className="header-control profile-header-control"
    type="button"
    onClick={() =>
      setActivePanel(activePanel === "profile" ? null : "profile")
    }
  >
    {profileData?.profilePicture ? (
      <img
        src={profileData.profilePicture}
        alt="Profile"
        className="header-profile-image"
      />
    ) : (
      <span className="header-profile-placeholder">
        {user.name?.charAt(0).toUpperCase()}
      </span>
    )}
    <span>Profile</span>
  </button>

  {/* Logout */}
  <button
    className="header-control logout-control"
    type="button"
    onClick={handleLogout}
  >
    ↪ Logout
  </button>
</div>
</div>

          <hr />

          {todayPendingTasks.length > 0 && (
            <div className="focus-banner">
              <div className="focus-icon">🎯</div>
              <div>
                <strong>Today&apos;s Focus</strong>
                <p>
                  You have <b>{todayPendingTasks.length}</b> pending task
                  {todayPendingTasks.length !== 1 ? "s" : ""} for today.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilter("pending");
                  setActivePanel(null);
                }}
              >
                View Tasks
              </button>
            </div>
          )}

          <div className="task-counts">
            <div className="summary-card total-card">
              <span className="summary-icon">📋</span>
              <strong>{totalTasks}</strong>
              <span>Total Tasks</span>
            </div>

            <div className="summary-card pending-card">
              <span className="summary-icon">⏳</span>
              <strong>{pendingTasks}</strong>
              <span>Pending</span>
            </div>

            <div className="summary-card completed-card">
              <span className="summary-icon">✓</span>
              <strong>{completedTasks}</strong>
              <span>Completed</span>
            </div>

            <div className="summary-card overdue-card">
              <span className="summary-icon">!</span>
              <strong>{overdueTasks}</strong>
              <span>Overdue</span>
            </div>
          </div>

          <div className="quick-stats">
            <div className="quick-stat">
              <span>📅</span>
              <div>
                <strong>{todayTasks}</strong>
                <small>Today&apos;s Tasks</small>
              </div>
            </div>

            <div className="quick-stat">
              <span>🚀</span>
              <div>
                <strong>{upcomingTasks}</strong>
                <small>Upcoming</small>
              </div>
            </div>

            <div className="quick-stat">
              <span>📈</span>
              <div>
                <strong>{progress}%</strong>
                <small>Completion Rate</small>
              </div>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-header">
              <div>
                <span>PRODUCTIVITY</span>
                <h3>Overall Task Progress</h3>
              </div>
              <strong>{progress}%</strong>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="section-title">
            <div>
              <span className="section-label">TASK PLANNER</span>
              <h2>{editingId ? "Edit Task" : "Create New Task"}</h2>
              <p>Organize your work with clear task details.</p>
            </div>
          </div>

          <form onSubmit={handleTaskSubmit} className="task-form">
            <div className="form-field">
              <label>Task Title</label>
              <input
                type="text"
                placeholder="Enter task title"
                value={taskData.title}
                onChange={(event) =>
                  setTaskData({ ...taskData, title: event.target.value })
                }
                required
              />
            </div>

            <div className="form-field">
              <label>Description</label>
              <input
                type="text"
                placeholder="Short description"
                value={taskData.description}
                onChange={(event) =>
                  setTaskData({
                    ...taskData,
                    description: event.target.value,
                  })
                }
              />
            </div>

            <div className="form-field">
              <label>Date</label>
              <input
                type="date"
                value={taskData.date}
                onChange={(event) =>
                  setTaskData({ ...taskData, date: event.target.value })
                }
              />
            </div>

            <div className="form-field">
              <label>Time</label>
              <input
                type="time"
                value={taskData.time}
                onChange={(event) =>
                  setTaskData({ ...taskData, time: event.target.value })
                }
              />
            </div>

            <div className="form-field">
              <label>Priority</label>
              <select
                value={taskData.priority}
                onChange={(event) =>
                  setTaskData({ ...taskData, priority: event.target.value })
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="form-field">
              <label>Category</label>
              <select
                value={taskData.category}
                onChange={(event) =>
                  setTaskData({ ...taskData, category: event.target.value })
                }
              >
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-buttons">
              <button type="submit" className="add-task-btn">
                {editingId ? "Update Task" : "+ Add Task"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetTaskForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="section-title task-heading">
            <div>
              <span className="section-label">WORKSPACE</span>
              <h2>My Tasks</h2>
              <p>Manage and track your daily work.</p>
            </div>

            {completedTasks > 0 && (
              <button
                type="button"
                className="clear-btn"
                onClick={clearCompleted}
              >
                Clear Completed
              </button>
            )}
          </div>

          <div className="task-controls">
            <div className="search-box">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Work">Work</option>
              <option value="Study">Study</option>
              <option value="Personal">Personal</option>
              <option value="Other">Other</option>
            </select>

            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="due">Due Date</option>
            </select>
          </div>

          <div className="task-list">
            {loadingTasks ? (
              <div className="empty-state">
                <h3>Loading tasks...</h3>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div>✓</div>
                <h3>No tasks found</h3>
                <p>Add your first task to start managing your work.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  className={`task-item ${task.completed ? "completed" : ""}`}
                  key={task.id}
                >
                  <div className="task-info">
                    <div className="task-top">
                      <h3>{task.title}</h3>
                      <span className={`priority-badge ${(task.priority || "Medium").toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}

                    <div className="task-meta">
                      <span>📅 {task.date || "No date"}</span>
                      <span>🕐 {task.time || "No time"}</span>
                      <span>📁 {task.category}</span>
                    </div>

                    <div className="task-status-row">
                      <span
                        className={`status-badge ${
                          task.completed ? "status-completed" : "status-pending"
                        }`}
                      >
                        {task.completed ? "✓ Completed" : "• Pending"}
                      </span>

                      {!task.completed && task.date && task.date < today && (
                        <span className="overdue-badge">⚠ Overdue</span>
                      )}

                      {task.completed && task.completedAt && (
                        <span className="completed-time">
                          Completed: {task.completedAt}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="task-actions">
                    <button
                      type="button"
                      className="complete-action"
                      onClick={() => handleComplete(task.id)}
                    >
                      {task.completed ? "Pending" : "Complete"}
                    </button>

                    <button
                      type="button"
                      className="edit-action"
                      onClick={() => handleEdit(task)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-action"
                      onClick={() => handleDelete(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="dashboard-footer">
            <span>
              {totalTasks} task{totalTasks !== 1 ? "s" : ""} in your workspace
            </span>

           
          </div>
        </div>
      </div>

      {activePanel && (
        <div className="side-overlay" onClick={() => setActivePanel(null)} />
      )}

      {/* Notifications panel */}
      <aside
        className={`side-panel ${
          activePanel === "notifications" ? "side-panel-open" : ""
        }`}
      >
        <div className="side-panel-header">
          <div>
            <span>ACTIVITY</span>
            <h2>Notifications</h2>
          </div>

          <button
            type="button"
            className="side-close"
            onClick={() => setActivePanel(null)}
          >
            ×
          </button>
        </div>

        <div className="side-panel-actions">
          <span>
            {allNotifications.length} alert
            {allNotifications.length !== 1 ? "s" : ""}
          </span>

          {notifications.length > 0 && (
            <button type="button" onClick={clearNotifications}>
              Clear
            </button>
          )}
        </div>

        <div className="side-panel-content">
          {allNotifications.length === 0 ? (
            <div className="side-empty">
              <div>🔔</div>
              <h3>All caught up!</h3>
              <p>No new notifications.</p>
            </div>
          ) : (
            allNotifications.map((notification) => (
              <div
                className={`side-notification ${notification.type}`}
                key={notification.id}
              >
                <div className="side-notification-icon">
                  {notification.type === "success"
                    ? "✓"
                    : notification.type === "overdue"
                      ? "!"
                      : notification.type === "delete"
                        ? "🗑"
                        : "🔔"}
                </div>

                <div>
                  <p>{notification.message}</p>
                  <small>{notification.time}</small>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
      
      {/* Profile panel */}
      <aside
        className={`side-panel profile-side-panel ${
          activePanel === "profile" ? "side-panel-open" : ""
        }`}
      >
        <div className="side-panel-header">
          <div>
            <span>ACCOUNT</span>
            <h2>My Profile</h2>
          </div>

          <button
            type="button"
            className="side-close"
            onClick={() => {
              setActivePanel(null);
              setEditingProfile(false);
            }}
          >
            ×
          </button>
        </div>

        <div className="profile-side-content">
          <div className="profile-user-card">
            <div className="large-profile-avatar">
              {profileData.profilePicture ? (
                <img
                  src={profileData.profilePicture}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                (profileData.name || user.name || "U")
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            {!editingProfile ? (
              <>
                <h3>{profileData.name || user.name}</h3>
                <p>{user.email}</p>

                <p style={{ marginTop: "10px", overflowWrap: "anywhere" }}>
                  {profileData.description || "No description added yet."}
                </p>

                <button
                  type="button"
                  className="profile-top-btn"
                  style={{ marginTop: "15px" }}
                  onClick={() => setEditingProfile(true)}
                >
                  ✏️ Edit Profile
                </button>
              </>
            ) : (
              <form
                onSubmit={handleProfileSave}
                style={{
                  width: "100%",
                  marginTop: "15px",
                  textAlign: "left",
                }}
              >
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(event) =>
                    setProfileData({
                      ...profileData,
                      name: event.target.value,
                    })
                  }
                  required
                  maxLength={100}
                  style={{ width: "100%", marginBottom: "12px" }}
                />

              <label>Profile Photo</label>

<input
  type="file"
  accept="image/*"
  onChange={(event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      alert("Please select an image smaller than 1 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setProfileData((previous) => ({
        ...previous,
        profilePicture: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  }}
  style={{
    display: "block",
    width: "100%",
    marginBottom: "15px",
  }}
/>

<small style={{ display: "block", marginBottom: "12px" }}> 
  choose from your gallary
</small>

                <label>Description</label>
                <textarea
                  value={profileData.description}
                  onChange={(event) =>
                    setProfileData({
                      ...profileData,
                      description: event.target.value,
                    })
                  }
                  placeholder="Write something about yourself..."
                  maxLength={300}
                  rows={4}
                  style={{
                    width: "100%",
                    marginBottom: "12px",
                    resize: "vertical",
                  }}
                />

                <label>Profile Picture URL</label>
                <input
                  type="url"
                  value={profileData.profilePicture}
                  onChange={(event) =>
                    setProfileData({
                      ...profileData,
                      profilePicture: event.target.value,
                    })
                  }
                  placeholder="Paste image URL here"
                  style={{ width: "100%", marginBottom: "12px" }}
                />

                <button type="submit" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  style={{ marginTop: "8px" }}
                  onClick={() => {
                    setProfileData({
                      name: user.name || "",
                      description: user.description || "",
                      profilePicture: user.profilePicture || "",
                    });
                    setEditingProfile(false);
                  }}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          <div className="profile-stat-grid">
            <div>
              <strong>{totalTasks}</strong>
              <span>Total</span>
            </div>
            <div>
              <strong>{completedTasks}</strong>
              <span>Completed</span>
            </div>
            <div>
              <strong>{pendingTasks}</strong>
              <span>Pending</span>
            </div>
            <div>
              <strong>{overdueTasks}</strong>
              <span>Overdue</span>
            </div>
          </div>

          <div className="profile-progress">
            <div>
              <span>Productivity</span>
              <strong>{progress}%</strong>
            </div>

            <div className="mini-progress">
              <div style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="profile-task-section">
            <h3>Your Tasks</h3>

            {tasks.length === 0 ? (
              <p className="profile-no-task">No tasks available yet.</p>
            ) : (
              tasks.map((task) => (
                <div className="profile-task" key={task.id}>
                  <div
                    className={
                      task.completed ? "task-check done" : "task-check"
                    }
                  >
                    {task.completed ? "✓" : "•"}
                  </div>

                  <div>
                    <strong>{task.title}</strong>
                    <small>
                      {task.completed
                        ? "Completed"
                        : task.date === today
                          ? "Due Today"
                          : task.date && task.date < today
                            ? "Overdue"
                            : "Pending"}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>


    </div>
  );
}

export default App;