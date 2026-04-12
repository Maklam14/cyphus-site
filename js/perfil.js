import { supabase } from "./supabase.js";


async function carregarPerfil() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();


  if (sessionError || !sessionData.session) {
    window.location.href = "entrar.html";
    return;
  }


  const user = sessionData.session.user;


  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, endereco")
    .eq("id", user.id)
    .single();


  if (error && error.code !== "PGRST116") {
    console.error("Erro ao carregar perfil:", error);
  }


  if (profile) {
    document.getElementById("nome").value = profile.full_name || "";
    document.getElementById("endereco").value = profile.endereco || "";
  }
}


const form = document.getElementById("form-perfil");
const mensagem = document.getElementById("mensagem");


form.addEventListener("submit", async (event) => {
  event.preventDefault();


  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;


  if (!user) {
    window.location.href = "entrar.html";
    return;
  }


  const nome = document.getElementById("nome").value.trim();
  const endereco = document.getElementById("endereco").value.trim();


  mensagem.textContent = "Salvando...";
  mensagem.style.color = "#6f6f6f";


  const { error } = await supabase
    .from("profiles")
    .update({ 
      full_name: nome || null,
      endereco: endereco || null 
    })
    .eq("id", user.id);


  if (error) {
    mensagem.textContent = "Erro ao salvar: " + error.message;
    mensagem.style.color = "#b91c1c";
    return;
  }


  mensagem.textContent = "Perfil atualizado com sucesso!";
  mensagem.style.color = "#166534";


  setTimeout(() => {
    window.location.href = "painel.html";
  }, 1500);
});


document.getElementById("logout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "entrar.html";
});


carregarPerfil();