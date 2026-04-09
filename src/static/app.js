document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search");
  const categoryFilter = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort");
  const userIcon = document.getElementById("user-icon");
  const loginModal = document.getElementById("login-modal");
  const loginBtn = document.getElementById("login-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  let allActivities = {};
  let isLoggedIn = false;
  const teachers = {"admin": "password"};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      allActivities = activities;

      updateActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to render activities
  function renderActivities(activityEntries) {
    // Clear loading message
    activitiesList.innerHTML = "";

    activityEntries.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft =
        details.max_participants - details.participants.length;

      // Create participants HTML with delete icons instead of bullet points
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participants-list">
              ${details.participants
                .map(
                  (email) =>
                    `<li><span class="participant-email">${email}</span>${isLoggedIn ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>` : ''}</li>`
                )
                .join("")}
            </ul>
          </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        ${isLoggedIn ? `<button class="register-btn" data-activity="${name}">Register Student</button>` : ''}
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);
    });

    // Add event listeners to delete and register buttons if logged in
    if (isLoggedIn) {
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", handleRegister);
      });
    }
  }
  async function handleRegister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");

    const email = prompt("Enter student email:", "your-email@mergington.edu");
    if (!email) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to register. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error registering:", error);
    }
  }
  // Function to update activities based on filters
  function updateActivities() {
    let entries = Object.entries(allActivities);

    // Filter by search
    const search = searchInput.value.toLowerCase();
    if (search) {
      entries = entries.filter(([name, details]) =>
        name.toLowerCase().includes(search) || details.description.toLowerCase().includes(search)
      );
    }

    // Filter by category
    const category = categoryFilter.value;
    if (category) {
      entries = entries.filter(([name, details]) => details.category === category);
    }

    // Sort
    const sort = sortSelect.value;
    if (sort === 'name') {
      entries.sort(([a], [b]) => a.localeCompare(b));
    } else if (sort === 'time') {
      entries.sort(([a, ad], [b, bd]) => ad.schedule.localeCompare(bd.schedule));
    }

    renderActivities(entries);
  }
  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Add event listeners for filters
  searchInput.addEventListener('input', updateActivities);
  categoryFilter.addEventListener('change', updateActivities);
  sortSelect.addEventListener('change', updateActivities);

  // Login modal
  userIcon.addEventListener("click", () => {
    if (isLoggedIn) {
      isLoggedIn = false;
      updateActivities();
    } else {
      loginModal.classList.remove("hidden");
    }
  });

  loginBtn.addEventListener("click", () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    if (teachers[username] === password) {
      isLoggedIn = true;
      loginModal.classList.add("hidden");
      updateActivities();
    } else {
      alert("Invalid credentials");
    }
  });

  cancelBtn.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });

  // Initialize app
  fetchActivities();
});
