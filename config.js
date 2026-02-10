/* Конфіг проекту.
  Ключів тут більше немає, бо ми перейшли на проксі-сервер (Google Apps Script).
  Безпека — наше все.
*/
const CONFIG = {
  // Ключ тепер лежить на сервері Google. Тут залишаємо пустоту.
  API_KEY: "",

  // Твій особистий сервер (Proxy), який спілкується з Groq
  API_URL:
    "https://script.google.com/macros/s/AKfycbxWFRIa-gMOd-EbB5eeHQtxQK2sJi4G18JyMbr9b_-vioH6NizqxJUz5v233C7xrijA/exec",

  // Модель, яку юзаємо
  MODEL: "llama-3.3-70b-versatile",
};
