// ============================================================
//  USTAWIENIA SKLEPU I PRODUKTY
//  Tu zmieniasz nazwę sklepu, koszt dostawy oraz ceny i opisy paczek.
// ============================================================

const SHOP = {
  name: "[NAZWA]",          // nazwa sklepu (logo, tytuł strony, stopka)
  shippingCost: 14.99,      // koszt dostawy w zł
  freeShippingFrom: 150,    // od jakiej kwoty dostawa jest darmowa (zł)
};

// Każda paczka to jeden blok { ... }. Pola:
//   id          - unikalny identyfikator (małe litery, bez spacji)
//   name        - nazwa paczki
//   description - krótki opis (dla jakiego wieku, ile niespodzianek)
//   price       - cena w zł (kropka zamiast przecinka, np. 49.99)
//   image       - ścieżka do zdjęcia, np. "img/mala-paczka.jpg".
//                 Puste "" = pokaże się ikona prezentu z napisem "Zdjęcie wkrótce".
//   size        - rozmiar ikony zastępczej: "small", "medium" lub "large"
const PRODUCTS = [
  {
    id: "mala-paczka",
    name: "Mała paczka",
    description: "Na początek dla najmłodszych, 3–6 lat. W środku 3 małe niespodzianki.",
    price: 49.99,
    image: "",
    size: "small",
  },
  {
    id: "srednia-paczka",
    name: "Średnia paczka",
    description: "Dla dzieci w wieku 6–9 lat. 5 niespodzianek, w tym jedna trochę większa.",
    price: 89.99,
    image: "",
    size: "medium",
  },
  {
    id: "duza-paczka",
    name: "Duża paczka",
    description: "Dla dzieci w wieku 9–13 lat. 8 niespodzianek i prezent na wielkie rozpakowywanie.",
    price: 149.99,
    image: "",
    size: "large",
  },
];
