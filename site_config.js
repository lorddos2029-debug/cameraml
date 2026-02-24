// IMPORTANT: Configuração dinâmica do produto e frete para o fluxo da pasta "tela"
// Lê a oferta escolhida na página inicial (armazenada no localStorage)
(function () {
  const selected =
    JSON.parse(localStorage.getItem("camera_selected_offer") || "{}") || {};

  const price =
    typeof selected.price === "number" && !isNaN(selected.price)
      ? selected.price
      : 89.9;

  const name =
    selected.name ||
    "Câmera Externa PTZ WIFI Lente Dupla [COMPRE 1 LEVE 2]";

  const basePrefix = window.location.pathname.includes("/tela/") ? "../" : "";
  const defaultImg = basePrefix + "images/compre1leve2.png";
  let img = defaultImg;
  if (selected.img) {
    img = /^https?:\/\//.test(selected.img)
      ? selected.img
      : basePrefix + selected.img.replace(/^\/+/, "");
  }

  window.SiteConfig = {
    product: {
      name,
      priceCurrent: price,
      priceOriginal: price * 4,
      images: [img],
      daysToDelivery: 7,
    },
    shipping: [
      {
        id: "express",
        company: "Frete Full",
        logo: "",
        daysMin: 1,
        daysMax: 2,
        price: 0,
        best_option: true,
      }
    ],
    upsells: [],
  };
})();
