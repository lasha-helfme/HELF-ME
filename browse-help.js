document.addEventListener("DOMContentLoaded", async () => {
  const supabaseClient = window.helfMeSupabase;

  const postTypeFilter = document.getElementById("postTypeFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const browseStatus = document.getElementById("browseStatus");
  const helpPosts = document.getElementById("helpPosts");

  if (
    !supabaseClient ||
    !postTypeFilter ||
    !categoryFilter ||
    !browseStatus ||
    !helpPosts
  ) {
    console.error("Browse help page could not be initialized.");
    return;
  }

  const typeLabels = {
    request: "დახმარება მჭირდება",
    offer: "შემიძლია დახმარება",
  };

  const categoryLabels = {
    physical: "ფიზიკური დახმარება",
    service: "სერვისი",
    information: "ინფორმაცია",
    transport: "ტრანსპორტი",
    other: "სხვა",
  };

  let posts = [];

  function setStatus(message, isError = false) {
    browseStatus.textContent = message;
    browseStatus.style.color = isError ? "red" : "";
  }

  function renderPosts() {
    const selectedType = postTypeFilter.value;
    const selectedCategory = categoryFilter.value;

    const filteredPosts = posts.filter((post) => {
      const typeMatches =
        selectedType === "all" ||
        post.post_type === selectedType;

      const categoryMatches =
        selectedCategory === "all" ||
        post.category === selectedCategory;

      return typeMatches && categoryMatches;
    });

    helpPosts.replaceChildren();

    if (filteredPosts.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent =
        "არჩეული ფილტრებით აქტიური განცხადებები ვერ მოიძებნა.";

      helpPosts.appendChild(emptyMessage);
      setStatus("ნაპოვნია 0 განცხადება.");
      return;
    }

    filteredPosts.forEach((post) => {
      const article = document.createElement("article");
      article.className = "help-post";

      const title = document.createElement("h3");
      title.textContent =
        typeLabels[post.post_type] || "დახმარება";

      const category = document.createElement("p");
      category.textContent =
        `კატეგორია: ${
          categoryLabels[post.category] || post.category
        }`;

      const description = document.createElement("p");
      description.textContent = post.description;

      const createdAt = document.createElement("p");

      const date = new Date(post.created_at);

      createdAt.textContent =
        `გამოქვეყნდა: ${date.toLocaleString("ka-GE")}`;

      article.appendChild(title);
      article.appendChild(category);
      article.appendChild(description);
      article.appendChild(createdAt);
if (post.user_id !== user.id) {
  const connectButton = document.createElement("button");
  connectButton.type = "button";
  connectButton.textContent = "დაკავშირება / დახმარება";

  connectButton.addEventListener("click", async () => {
    connectButton.disabled = true;
    connectButton.textContent = "იგზავნება...";

    const { error } = await supabaseClient
      .from("help_connections")
      .insert({
        post_id: post.id
      });

    if (error) {
      console.error(error);

      if (error.code === "23505") {
        connectButton.textContent = "მოთხოვნა უკვე გაგზავნილია";
      } else {
        connectButton.textContent = "ვერ გაიგზავნა — სცადეთ თავიდან";
        connectButton.disabled = false;
      }

      return;
    }

    connectButton.textContent = "მოთხოვნა გაგზავნილია";
  });

  article.appendChild(connectButton);
}
      helpPosts.appendChild(article);
    });

    setStatus(
      `ნაპოვნია ${filteredPosts.length} აქტიური განცხადება.`
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "auth.html";
    return;
  }

  try {
    setStatus("განცხადებები იტვირთება...");

    const { data, error } = await supabaseClient
      .from("help_posts")
      .select(
        "id, user_id, post_type, category, description, status, created_at"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    posts = data || [];

    renderPosts();
  } catch (error) {
    console.error(error);

    setStatus(
      error.message ||
        "განცხადებების ჩატვირთვა ვერ მოხერხდა.",
      true
    );
  }

  postTypeFilter.addEventListener(
    "change",
    renderPosts
  );

  categoryFilter.addEventListener(
    "change",
    renderPosts
  );
});
