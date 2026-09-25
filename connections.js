document.addEventListener("DOMContentLoaded", async () => {
  const supabaseClient = window.helfMeSupabase;

  const connectionsStatus =
    document.getElementById("connectionsStatus");

  const receivedConnections =
    document.getElementById("receivedConnections");

  const sentConnections =
    document.getElementById("sentConnections");

  if (
    !supabaseClient ||
    !connectionsStatus ||
    !receivedConnections ||
    !sentConnections
  ) {
    console.error("Connections page could not initialize.");
    return;
  }

  const typeLabels = {
    request: "დახმარება მჭირდება",
    offer: "შემიძლია დახმარება"
  };

  const categoryLabels = {
    physical: "ფიზიკური დახმარება",
    service: "სერვისი",
    information: "ინფორმაცია",
    transport: "ტრანსპორტი",
    other: "სხვა"
  };

  const statusLabels = {
    pending: "ელოდება პასუხს",
    accepted: "მიღებულია",
    rejected: "უარყოფილია",
    cancelled: "გაუქმებულია"
  };

  function setStatus(message, isError = false) {
    connectionsStatus.textContent = message;

    connectionsStatus.style.color =
      isError ? "#dc2626" : "";
  }

  function createTextElement(tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
  }

  function createConnectionCard(
    connection,
    post,
    mode,
    user
  ) {
    const article = document.createElement("article");
    article.className = "help-post";

    const title = createTextElement(
      "h3",
      post
        ? typeLabels[post.post_type] || "განცხადება"
        : "განცხადება"
    );

    article.appendChild(title);

    if (post) {
      const category = createTextElement(
        "p",
        `კატეგორია: ${
          categoryLabels[post.category] || post.category
        }`
      );

      const description = createTextElement(
        "p",
        post.description || ""
      );

      article.appendChild(category);
      article.appendChild(description);
    } else {
      article.appendChild(
        createTextElement(
          "p",
          "განცხადების დეტალები მიუწვდომელია."
        )
      );
    }

    const status = createTextElement(
      "p",
      `სტატუსი: ${
        statusLabels[connection.status] ||
        connection.status
      }`
    );

    article.appendChild(status);

    const date = new Date(connection.created_at);

    article.appendChild(
      createTextElement(
        "p",
        `გაგზავნილია: ${date.toLocaleString("ka-GE")}`
      )
    );

    if (
      mode === "received" &&
      connection.receiver_id === user.id &&
      connection.status === "pending"
    ) {
      const acceptButton =
        document.createElement("button");

      acceptButton.type = "button";
      acceptButton.textContent = "მიღება";

      const rejectButton =
        document.createElement("button");

      rejectButton.type = "button";
      rejectButton.textContent = "უარყოფა";

      acceptButton.addEventListener(
        "click",
        async () => {
          await updateConnectionStatus(
            connection.id,
            "accepted",
            acceptButton,
            rejectButton,
            user
          );
        }
      );

      rejectButton.addEventListener(
        "click",
        async () => {
          await updateConnectionStatus(
            connection.id,
            "rejected",
            acceptButton,
            rejectButton,
            user
          );
        }
      );

      article.appendChild(acceptButton);
      article.appendChild(rejectButton);
    }

    return article;
  }

  async function updateConnectionStatus(
    connectionId,
    newStatus,
    acceptButton,
    rejectButton,
    user
  ) {
    acceptButton.disabled = true;
    rejectButton.disabled = true;

    setStatus("მოთხოვნა მუშავდება...");

    const { error } = await supabaseClient
      .from("help_connections")
      .update({
        status: newStatus
      })
      .eq("id", connectionId)
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (error) {
      console.error(error);

      setStatus(
        "მოთხოვნის განახლება ვერ მოხერხდა.",
        true
      );

      acceptButton.disabled = false;
      rejectButton.disabled = false;

      return;
    }

    await loadConnections(user);
  }

  async function loadConnections(user) {
    setStatus("მოთხოვნები იტვირთება...");

    receivedConnections.replaceChildren();
    sentConnections.replaceChildren();

    const [
      receivedResult,
      sentResult
    ] = await Promise.all([
      supabaseClient
        .from("help_connections")
        .select(
          "id, post_id, sender_id, receiver_id, status, created_at, updated_at"
        )
        .eq("receiver_id", user.id)
        .order("created_at", {
          ascending: false
        }),

      supabaseClient
        .from("help_connections")
        .select(
          "id, post_id, sender_id, receiver_id, status, created_at, updated_at"
        )
        .eq("sender_id", user.id)
        .order("created_at", {
          ascending: false
        })
    ]);

    if (receivedResult.error) {
      console.error(receivedResult.error);
      setStatus(
        "შემოსული მოთხოვნების ჩატვირთვა ვერ მოხერხდა.",
        true
      );
      return;
    }

    if (sentResult.error) {
      console.error(sentResult.error);
      setStatus(
        "გაგზავნილი მოთხოვნების ჩატვირთვა ვერ მოხერხდა.",
        true
      );
      return;
    }

    const received =
      receivedResult.data || [];

    const sent =
      sentResult.data || [];

    const allConnections = [
      ...received,
      ...sent
    ];

    const postIds = [
      ...new Set(
        allConnections
          .map((item) => item.post_id)
          .filter(Boolean)
      )
    ];

    const postsById = new Map();

    if (postIds.length > 0) {
      const { data: posts, error: postsError } =
        await supabaseClient
          .from("help_posts")
          .select(
            "id, post_type, category, description, status, created_at"
          )
          .in("id", postIds);

      if (postsError) {
        console.error(postsError);

        setStatus(
          "განცხადებების ინფორმაციის ჩატვირთვა ვერ მოხერხდა.",
          true
        );

        return;
      }

      (posts || []).forEach((post) => {
        postsById.set(post.id, post);
      });
    }

    if (received.length === 0) {
      receivedConnections.appendChild(
        createTextElement(
          "p",
          "შემოსული მოთხოვნები ჯერ არ გაქვს."
        )
      );
    } else {
      received.forEach((connection) => {
        receivedConnections.appendChild(
          createConnectionCard(
            connection,
            postsById.get(connection.post_id),
            "received",
            user
          )
        );
      });
    }

    if (sent.length === 0) {
      sentConnections.appendChild(
        createTextElement(
          "p",
          "გაგზავნილი მოთხოვნები ჯერ არ გაქვს."
        )
      );
    } else {
      sent.forEach((connection) => {
        sentConnections.appendChild(
          createConnectionCard(
            connection,
            postsById.get(connection.post_id),
            "sent",
            user
          )
        );
      });
    }

    setStatus(
      `შემოსული: ${received.length} • გაგზავნილი: ${sent.length}`
    );
  }

  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "auth.html";
    return;
  }

  await loadConnections(user);
});
