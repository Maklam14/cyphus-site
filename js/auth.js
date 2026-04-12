import { supabase } from "./supabase.js";

const formCadastro = document.getElementById("form-cadastro");
const formLogin = document.getElementById("form-login");
const btnLogout = document.getElementById("logout");

if (formCadastro) {
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("senha").value.trim();
    const msg = document.getElementById("mensagem");

    msg.textContent = "Criando conta...";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      msg.textContent = "Erro: " + error.message;
      return;
    }

    msg.textContent = "Conta criada com sucesso! Verifique seu e-mail.";
    formCadastro.reset();
  });
}

if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("senha").value.trim();
    const msg = document.getElementById("mensagem");

    msg.textContent = "Entrando...";

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      msg.textContent = "Erro: " + error.message;
      return;
    }

    msg.textContent = "Login realizado com sucesso!";
    window.location.href = "painel.html";
  });
}

if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "entrar.html";
  });
}