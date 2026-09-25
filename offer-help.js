document.addEventListener("DOMContentLoaded", async () => {
  const supabaseClient = window.helfMeSupabase;

  const form = document.getElementById("offerHelpForm");
  const categoryInput = document.getElementById("category");
  const descriptionInput = document.getElementById("description");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (
    !supabaseClient ||
    !form ||
    !categoryInput ||
    !descriptionInput ||
    !submitButton
  ) {
    console.error("Offer help page could not be initialized.");
    return;
  }

  const statusMessage = document.createElement("p");
  statusMessage.setAttribute("role", "status");
  statusMessage.setAttribute("aria-live", "polite");
  form.appendChild(statusMessage);

  function showMessage(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "red" : "green";
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading
      ? "იგზავნება..."
      : "დახმარების შეთავაზება";
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "auth.html";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const category = categoryInput.value;
    const description = descriptionInput.value.trim();

const allowedCategories = [
  "physical",
  "service",
  "information",
  "transport",
  "other",
];

if (!allowedCategories.includes(category)) {
  showMessage("გთხოვ, აირჩიე დახმარების კატეგორია.", true);
  return;
}

if (description.length < 5) {
  showMessage("აღწერა უნდა შეიცავდეს მინიმუმ 5 სიმბოლოს.", true);
  return;
}

if (description.length > 2000) {
  showMessage("აღწერა არ უნდა აღემატებოდეს 2000 სიმბოლოს.", true);
  return;
}

try {
  setLoading(true);
  showMessage("შეთავაზება იგზავნება...");

  const { error } = await supabaseClient
    .from("help_posts")
    .insert([
      {
        user_id: user.id,
        post_type: "offer",
        category,
        description,
        status: "active",
      },
    ]);

  if (error) {
    throw error;
  }

  form.reset();
  showMessage("დახმარების შეთავაზება წარმატებით გამოქვეყნდა.");
} catch (error) {
  console.error(error);

  showMessage(
    error.message || "შეთავაზების გამოქვეყნება ვერ მოხერხდა.",
    true
  );
} finally {
  setLoading(false);
}
});
});
