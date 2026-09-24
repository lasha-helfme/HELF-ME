document.addEventListener("DOMContentLoaded", () => {
  const supabaseClient = window.helfMeSupabase;

  const authForm = document.getElementById("authForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginButton");
  const signupButton = document.getElementById("signupButton");
  const authMessage = document.getElementById("authMessage");

  function showMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.style.color = isError ? "red" : "green";
  }

  function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    signupButton.disabled = isLoading;
  }

  async function login() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showMessage("გთხოვ, შეავსე ელფოსტა და პაროლი.", true);
      return;
    }

    try {
      setLoading(true);
      showMessage("შესვლა მიმდინარეობს...");

      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      showMessage("შესვლა წარმატებულია.");

      window.location.href = "index.html";
    } catch (error) {
      showMessage(error.message || "შესვლა ვერ მოხერხდა.", true);
    } finally {
      setLoading(false);
    }
  }

  async function signup() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showMessage("გთხოვ, შეავსე ელფოსტა და პაროლი.", true);
      return;
    }

    if (password.length < 8) {
      showMessage("პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს.", true);
      return;
    }

    try {
      setLoading(true);
      showMessage("რეგისტრაცია მიმდინარეობს...");

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        showMessage("რეგისტრაცია წარმატებულია.");
        window.location.href = "index.html";
      } else {
        showMessage(
          "რეგისტრაცია წარმატებულია. შეამოწმე ელფოსტა ანგარიშის დასადასტურებლად."
        );
      }
    } catch (error) {
      showMessage(error.message || "რეგისტრაცია ვერ მოხერხდა.", true);
    } finally {
      setLoading(false);
    }
  }

  loginButton.addEventListener("click", (event) => {
    event.preventDefault();
    login();
  });

  signupButton.addEventListener("click", (event) => {
    event.preventDefault();
    signup();
  });

  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    login();
  });
});
