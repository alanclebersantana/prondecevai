// =====================================================================
// CONFIGURAÇÃO DO FIREBASE — Pronde cê vai?
// Usado pelo site (index.html) e pelo painel (painel.html).
//
// Enquanto apiKey estiver vazio, os dois funcionam em MODO TESTE
// (pedidos salvos só no navegador).
//
// Onde pegar: Console do Firebase > ⚙ Configurações do projeto >
// Seus apps > App da Web > "Configuração do SDK" > Config.
// =====================================================================
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Único e-mail que pode entrar no painel (o mesmo das regras do Firestore).
window.ADMIN_EMAIL = "";
