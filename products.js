// ============================================================
//  USTAWIENIA SKLEPU I PRODUKTY
//  Tu zmieniasz nazwę sklepu, ceny dostawy i listę produktów.
// ============================================================

const SHOP = {
  name: "[NAZWA]",          // nazwa sklepu (logo, tytuł strony, stopka)
  shippingCost: 14.99,      // koszt dostawy w zł
  freeShippingFrom: 150,    // od jakiej kwoty dostawa jest darmowa (zł)
};

// Każdy produkt to jeden blok { ... }. Pola:
//   id          - unikalny identyfikator (małe litery, bez spacji, np. "kapelusz-czarownicy")
//   name        - nazwa produktu
//   description - krótki opis
//   price       - cena w zł (kropka zamiast przecinka, np. 49.99)
//   image       - ścieżka do zdjęcia, np. "img/kapelusz.jpg"
//   category    - kategoria (na jej podstawie powstają przyciski filtrów)
const PRODUCTS = [
  {
    id: "dynia-led",
    name: "Świecąca dynia LED 30 cm",
    description: "Ręcznie malowana dynia z ciepłym światłem LED. Działa na baterie, starcza na całą noc.",
    price: 39.99,
    image: "img/placeholder.svg",
    category: "Dekoracje",
  },
  {
    id: "girlanda-nietoperze",
    name: "Girlanda z nietoperzy",
    description: "3 metry czarnych nietoperzy z filcu. Idealna nad drzwi, okno albo kominek.",
    price: 24.99,
    image: "img/placeholder.svg",
    category: "Dekoracje",
  },
  {
    id: "kapelusz-czarownicy",
    name: "Kapelusz czarownicy",
    description: "Wysoki, fioletowy kapelusz ze złotą klamrą. Rozmiar uniwersalny.",
    price: 49.99,
    image: "img/placeholder.svg",
    category: "Kostiumy",
  },
  {
    id: "peleryna-wampira",
    name: "Peleryna wampira",
    description: "Elegancka czarna peleryna z czerwoną podszewką i wysokim kołnierzem.",
    price: 79.99,
    image: "img/placeholder.svg",
    category: "Kostiumy",
  },
  {
    id: "czekoladowe-duszki",
    name: "Czekoladowe duszki (12 szt.)",
    description: "Mleczna czekolada w kształcie małych duchów. Pudełko na przyjęcie lub prezent.",
    price: 34.99,
    image: "img/placeholder.svg",
    category: "Słodycze",
  },
  {
    id: "swieca-dyniowa-noc",
    name: "Świeca „Dyniowa noc”",
    description: "Sojowa świeca o zapachu dyni, cynamonu i wanilii. Czas palenia ok. 40 godzin.",
    price: 59.99,
    image: "img/placeholder.svg",
    category: "Świece",
  },
];
