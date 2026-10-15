const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");
const cors = require("cors");
const bcrypt = require("bcrypt");

require("dotenv").config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const User = require("./models/User");
const Task = require("./models/Task");

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// MIDDLEWARE
// ==========================

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ==========================
// MONGODB CONNECTION
// ==========================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

// ==========================
// TEST API
// ==========================

app.get("/", (req, res) => {
  res.status(200).send("Task Management API is running");
});
app.get("/test-tasks", (req, res) => {
  res.send("Tasks route is working");
});


// ==========================
// SIGNUP API
// ==========================

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({
      message: "Signup successful",
    });
  } catch (error) {
    console.error("Signup error:", error.message);

    return res.status(500).json({
      message: "Signup failed",
    });
  }
});

// ==========================
// LOGIN API
// ==========================

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Login failed",
    });
  }
});

// ==========================
// FORGOT PASSWORD API
// ==========================

app.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        message: "Email and new password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      message: "Password reset failed",
    });
  }
});

// ==========================
// GET ALL TASKS FOR A USER
// ==========================

app.get("/tasks/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email)
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const tasks = await Task.find({
      userEmail: email,
    }).sort({ createdAt: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error.message);

    return res.status(500).json({
      message: "Failed to load tasks",
    });
  }
});

// ==========================
// ADD NEW TASK
// ==========================

app.post("/tasks", async (req, res) => {
  try {
    const {
      userEmail,
      title,
      description,
      date,
      time,
      priority,
      category,
    } = req.body;

    if (
      !userEmail ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        message: "User email and task title are required",
      });
    }

    const email = userEmail.trim().toLowerCase();

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const task = await Task.create({
      userEmail: email,
      title: title.trim(),
      description: description || "",
      date: date || "",
      time: time || "",
      priority: priority || "Medium",
      category: category || "Work",
    });

    return res.status(201).json({
      message: "Task added successfully",
      task,
    });
  } catch (error) {
    console.error("Add task error:", error.message);

    return res.status(500).json({
      message: "Failed to add task",
    });
  }
});

// ==========================
// UPDATE TASK
// ==========================

app.put("/tasks/:id", async (req, res) => {
  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({
        message: "User email is required",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const email = userEmail.trim().toLowerCase();

    const updates = {};

    const allowedFields = [
      "title",
      "description",
      "date",
      "time",
      "priority",
      "category",
      "completed",
    ];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (updates.title !== undefined) {
      if (
        typeof updates.title !== "string" ||
        !updates.title.trim()
      ) {
        return res.status(400).json({
          message: "Task title cannot be empty",
        });
      }

      updates.title = updates.title.trim();
    }

    if (updates.completed === true) {
      updates.completedAt = new Date();
    } else if (updates.completed === false) {
      updates.completedAt = null;
    }

    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userEmail: email,
      },
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error.message);

    return res.status(500).json({
      message: "Failed to update task",
    });
  }
});

// ==========================
// DELETE TASK
// ==========================

app.delete("/tasks/:id", async (req, res) => {
  try {
    const email = req.body.userEmail
      ?.trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "User email is required",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      userEmail: email,
    });

    if (!deletedTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error.message);

    return res.status(500).json({
      message: "Failed to delete task",
    });
  }
});

app.get("/test-tasks", (req, res) => {
  console.log("TEST TASKS ROUTE HIT");
  res.send("Tasks route is working");
});


// ===============================
// GET USER PROFILE
// ===============================

app.get("/profile-test", (req, res) => {
  res.json({ message: "Profile route is working" });
});

app.get("/profile/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const user = await User.findOne({ email }).select(
      "name email description profilePicture"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
});

// ===============================
// UPDATE USER PROFILE
// ===============================
app.put("/profile/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const { name, description, profilePicture } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be text",
      });
    }

  if (
  profilePicture !== undefined &&
  typeof profilePicture !== "string"
) {
  return res.status(400).json({
    message: "Profile picture must be an image string",
  });
}

if (
  typeof profilePicture === "string" &&
  profilePicture.length > 8 * 1024 * 1024
) {
  return res.status(413).json({
    message: "Image is too large. Please choose a smaller image.",
  });
}

    const user = await User.findOneAndUpdate(
      { email },
      {
        name: name.trim(),
        description:
          description === undefined ? "" : description.trim(),
        profilePicture:
          profilePicture === undefined ? "" : profilePicture.trim(),
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).select("name email description profilePicture");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Failed to update profile",
    });
  }
});




// ==========================
// START SERVER
// ==========================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});