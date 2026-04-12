import { supabase } from "./supabase.js";

const form = document.getElementById("form-esqueci-senha");
const emailInput = document.getElementById("email");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  mensagem.textContent = "Enviando link...";
  mensagem.style.color = "#6f6f6f";

  const email = emailInput.value.trim();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/nova-senha.html`
  });

  if (error) {
    mensagem.textContent = error.message;
    mensagem.style.color = "#b91c1c";
    return;
  }

  mensagem.textContent = "Se o e-mail existir, você receberá um link de recuperação.";
  mensagem.style.color = "#166534";
});