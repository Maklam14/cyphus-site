import { supabase } from "./supabase.js";

const form = document.getElementById("form-nova-senha");
const senhaInput = document.getElementById("senha");
const confirmarSenhaInput = document.getElementById("confirmar-senha");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const senha = senhaInput.value.trim();
  const confirmarSenha = confirmarSenhaInput.value.trim();

  if (senha.length < 6) {
    mensagem.textContent = "A senha precisa ter pelo menos 6 caracteres.";
    mensagem.style.color = "#b91c1c";
    return;
  }

  if (senha !== confirmarSenha) {
    mensagem.textContent = "As senhas não coincidem.";
    mensagem.style.color = "#b91c1c";
    return;
  }

  mensagem.textContent = "Atualizando senha...";
  mensagem.style.color = "#6f6f6f";

  const { error } = await supabase.auth.updateUser({
    password: senha
  });

  if (error) {
    mensagem.textContent = error.message;
    mensagem.style.color = "#b91c1c";
    return;
  }

  mensagem.textContent = "Senha atualizada com sucesso. Você já pode entrar.";
  mensagem.style.color = "#166534";

  setTimeout(() => {
    window.location.href = "entrar.html";
  }, 1800);
});