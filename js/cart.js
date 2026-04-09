console.log("CART.JS CARREGADO");
document.addEventListener("DOMContentLoaded", () => {
  const btnCheckout = document.getElementById("btnCheckout");

  if (btnCheckout) {
    btnCheckout.addEventListener("click", () => {
      // Redireciona para o checkout
      window.location.href = "checkout.html";
    });
  }
});