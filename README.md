# Kalkulator SAG MTB

Prosty projekt edukacyjny aplikacji PWA do obliczania SAG-u zawieszenia roweru MTB.

Projekt jest rozwijany etapami, bez frameworków i bez zewnętrznych bibliotek. Celem jest nauka budowania aplikacji internetowej od podstaw: od struktury HTML, przez CSS i JavaScript, aż po podstawowe mechanizmy PWA.

## Stan po Etapie 7

W Etapie 7 przygotowano projekt do testowania jako aplikację PWA.

Dodano i uporządkowano:

- instrukcję uruchamiania projektu lokalnie przez prosty serwer HTTP,
- checklistę testów formularza i obliczeń,
- checklistę testów walidacji błędów,
- checklistę testów dostępności i wyglądu mobile-first,
- checklistę testów PWA: manifest, service worker, cache, offline i instalacja,
- instrukcję testowania na telefonie,
- aktualizację wersji cache do `sag-pwa-v7`, żeby przeglądarka pobrała świeże pliki.

Aplikacja ma już strukturę HTML, wygląd mobile-first, działający kalkulator, walidację danych, manifest PWA, ikony oraz podstawowe działanie offline po pierwszym załadowaniu.

## Założenia projektu

Aplikacja:

- działa w przeglądarce,
- może zostać dodana na ekran główny telefonu,
- po pierwszym załadowaniu ma działać offline,
- nie ma backendu,
- nie ma kont użytkowników,
- nie korzysta z bazy danych,
- nie zbiera danych osobowych,
- wykonuje obliczenia lokalnie w przeglądarce.

Technologie:

- HTML5,
- CSS3,
- JavaScript.

W projekcie nie używamy:

- Reacta,
- Tailwinda,
- Bootstrapa,
- zewnętrznych bibliotek.

## Struktura projektu

```text
sag-pwa/
├── index.html
├── styles.css
├── script.js
├── manifest.webmanifest
├── service-worker.js
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

## Zakres MVP

Pierwsza wersja aplikacji robi jedną rzecz dobrze: oblicza SAG zawieszenia.

Użytkownik wpisuje:

- typ zawieszenia: widelec albo damper / tylny amortyzator,
- skok zawieszenia w milimetrach,
- zmierzone ugięcie w milimetrach,
- docelowy SAG w procentach.

Aplikacja pokazuje:

- aktualny SAG w procentach,
- docelowe ugięcie w milimetrach,
- różnicę względem celu w punktach procentowych,
- różnicę względem celu w milimetrach,
- interpretację wyniku.

Interpretacja:

- jeżeli różnica mieści się w ±1 punkt procentowy: `SAG bliski celu`,
- jeżeli aktualny SAG jest niższy od celu: `SAG za mały`,
- jeżeli aktualny SAG jest wyższy od celu: `SAG za duży`.

## Wzory

```text
SAG % = zmierzone ugięcie / skok zawieszenia × 100
```

```text
Docelowe ugięcie = skok zawieszenia × docelowy SAG % / 100
```

```text
Różnica procentowa = aktualny SAG % - docelowy SAG %
```

```text
Różnica w mm = zmierzone ugięcie - docelowe ugięcie
```

## Walidacja danych

Aplikacja obsługuje:

- puste pola,
- tekst zamiast liczby,
- przecinek jako separator dziesiętny, np. `32,5`,
- zero w polu skoku,
- liczby ujemne,
- ugięcie większe niż skok zawieszenia,
- docelowy SAG równy `0`,
- docelowy SAG większy lub równy `100%`,
- wartości fizycznie nielogiczne wynikające z relacji między skokiem i ugięciem.

Komunikaty błędów są tekstowe i powiązane z odpowiednimi polami formularza przez `aria-describedby` oraz `aria-invalid`.

## Wymagania dostępności

Aplikacja powinna być wygodna na telefonie oraz możliwa do obsługi za pomocą klawiatury i czytników ekranu.

Zasady:

- każde pole formularza ma etykietę `label`,
- komunikaty błędów nie zależą wyłącznie od koloru,
- wynik jest czytelny tekstowo,
- focus jest dobrze widoczny,
- kontrast tekstu i tła jest wystarczający,
- przyciski i pola są wygodne na ekranie dotykowym.

## Jak uruchomić projekt lokalnie

Service worker nie działa poprawnie po otwarciu pliku bezpośrednio z dysku przez `file://`. Do testów użyj lokalnego serwera.

W katalogu nadrzędnym projektu uruchom:

```bash
cd sag-pwa
python3 -m http.server 8080
```

Następnie otwórz w przeglądarce:

```text
http://localhost:8080
```

Na Windowsie, jeżeli komenda `python3` nie działa, spróbuj:

```bash
python -m http.server 8080
```

## Jak działa `script.js`

Kod został podzielony na mniejsze funkcje:

- `parseLocalizedNumber()` — zamienia wpisany tekst na liczbę i obsługuje przecinek dziesiętny,
- `validateFormValues()` — sprawdza poprawność danych,
- `calculateSag()` — wykonuje obliczenia,
- `interpretSag()` — wybiera komunikat interpretacyjny,
- `showResult()` — pokazuje wynik w interfejsie,
- `hideResult()` — czyści sekcję wyniku,
- `registerServiceWorker()` — uruchamia service workera, jeżeli przeglądarka go obsługuje.

Taki podział ułatwia naukę, czytanie kodu i późniejsze testowanie.

## Jak działa `manifest.webmanifest`

Manifest opisuje aplikację dla przeglądarki i systemu operacyjnego. Dzięki niemu przeglądarka wie między innymi:

- jak nazywa się aplikacja,
- jaką ikonę pokazać na ekranie głównym,
- od jakiego adresu uruchomić aplikację,
- czy ma otwierać się w trybie `standalone`, czyli bardziej jak aplikacja niż zwykła karta przeglądarki,
- jaki kolor zastosować dla elementów interfejsu systemowego,
- w jakiej orientacji ekranu aplikacja jest projektowana.

Manifest współpracuje z service workerem. Manifest opisuje aplikację systemowi, a service worker pozwala zapisać jej pliki w cache i uruchomić ją ponownie bez internetu.

## Jak działa `service-worker.js`

Service worker działa w tle, poza głównym kodem strony. W tej aplikacji odpowiada za podstawowy tryb offline.

Wykorzystuje trzy najważniejsze zdarzenia:

- `install` — zapisuje podstawowe pliki aplikacji w cache,
- `activate` — usuwa stare wersje cache,
- `fetch` — przechwytuje żądania plików i zwraca wersję z cache, jeżeli jest dostępna.

Zastosowana strategia to proste `cache first`: aplikacja najpierw szuka pliku w pamięci podręcznej, a dopiero potem próbuje pobrać go z sieci. To dobre rozwiązanie dla małej aplikacji statycznej, która składa się z kilku plików i nie pobiera danych z serwera.

Podczas kolejnych zmian w plikach warto zmienić nazwę cache, np. z `sag-pwa-v7` na `sag-pwa-v8`, żeby przeglądarka pobrała świeżą wersję aplikacji.

## Etapy pracy

1. **Etap 1: projekt funkcjonalny**  
   Utworzenie struktury projektu, dokumentacji i minimalnych plików startowych.

2. **Etap 2: HTML**  
   Przygotowanie semantycznego szkieletu aplikacji i formularza.

3. **Etap 3: CSS mobile-first**  
   Dodanie wyglądu dopasowanego najpierw do telefonu, później do większych ekranów.

4. **Etap 4: JavaScript i walidacja**  
   Dodanie obliczeń, walidacji danych i wyświetlania wyniku.

5. **Etap 5: manifest PWA**  
   Przygotowanie danych instalacyjnych aplikacji, nazwy, ikon i trybu `standalone`.

6. **Etap 6: service worker i offline**  
   Dodanie cache oraz podstawowego działania offline po pierwszym załadowaniu.

7. **Etap 7: testowanie PWA**  
   Sprawdzenie formularza, walidacji, działania offline i instalacji na telefonie.

## Checklista testów

### Testy poprawnych danych

- [ ] Skok: `160`, ugięcie: `32`, cel: `20` → aktualny SAG: `20,0%`, interpretacja: `SAG bliski celu`.
- [ ] Skok: `150`, ugięcie: `45`, cel: `30` → aktualny SAG: `30,0%`, interpretacja: `SAG bliski celu`.
- [ ] Skok: `160`, ugięcie: `32,5`, cel: `20` → aplikacja poprawnie obsługuje przecinek.
- [ ] Skok: `160`, ugięcie: `24`, cel: `20` → interpretacja: `SAG za mały`.
- [ ] Skok: `160`, ugięcie: `40`, cel: `20` → interpretacja: `SAG za duży`.

### Testy błędów

- [ ] Puste pola pokazują tekstowe komunikaty błędów.
- [ ] Skok równy `0` jest odrzucony.
- [ ] Skok ujemny jest odrzucony.
- [ ] Ugięcie ujemne jest odrzucone.
- [ ] Ugięcie większe niż skok jest odrzucone.
- [ ] Docelowy SAG równy `0` jest odrzucony.
- [ ] Docelowy SAG większy lub równy `100` jest odrzucony.
- [ ] Tekst zamiast liczby jest odrzucony.

### Testy wyglądu i dostępności

- [ ] Aplikacja nie ma poziomego przewijania na telefonie.
- [ ] Pola i przyciski są wygodne do dotknięcia.
- [ ] Focus jest dobrze widoczny podczas przechodzenia klawiaturą.
- [ ] Komunikaty błędów są tekstowe, a nie wyłącznie kolorystyczne.
- [ ] Wynik jest czytelny tekstowo.
- [ ] Każde pole formularza ma etykietę `label`.
- [ ] Błędy są powiązane z polami przez `aria-describedby`.

### Testy PWA w przeglądarce

W Chrome lub Edge otwórz narzędzia deweloperskie i sprawdź kartę **Application**.

- [ ] Manifest jest wykrywany.
- [ ] Ikony aplikacji są widoczne.
- [ ] `display` ma wartość `standalone`.
- [ ] Service worker jest zarejestrowany.
- [ ] Cache zawiera pliki aplikacji.
- [ ] Po przełączeniu trybu offline aplikacja nadal się otwiera.
- [ ] Po odświeżeniu offline formularz i kalkulator nadal działają.

### Testy instalacji na telefonie

Do realnej instalacji na telefonie najlepiej opublikować aplikację pod adresem HTTPS, np. przez GitHub Pages, Netlify albo Vercel.

Android / Chrome:

- [ ] Otwórz adres aplikacji w Chrome.
- [ ] Wybierz opcję instalacji aplikacji lub dodania do ekranu głównego.
- [ ] Uruchom aplikację z ikony.
- [ ] Sprawdź, czy wygląda jak aplikacja, a nie zwykła karta przeglądarki.
- [ ] Po pierwszym załadowaniu sprawdź działanie bez internetu.

iPhone / Safari:

- [ ] Otwórz adres aplikacji w Safari.
- [ ] Wybierz przycisk udostępniania.
- [ ] Wybierz „Dodaj do ekranu początkowego”.
- [ ] Uruchom aplikację z ikony.
- [ ] Sprawdź, czy kalkulator działa po ponownym uruchomieniu.

## Wynik sprawdzeń technicznych w Etapie 7

W ramach przygotowania paczki sprawdzono:

- składnię `script.js`,
- składnię `service-worker.js`,
- podstawowe funkcje obliczeniowe kalkulatora,
- poprawne serwowanie plików przez lokalny serwer HTTP,
- poprawność JSON w `manifest.webmanifest`,
- obecność wymaganych ikon,
- rozmiary ikon `192×192` i `512×512`,
- powiązanie pól formularza z etykietami,
- istnienie elementów wskazanych przez `aria-describedby`,
- obecność rejestracji service workera,
- obecność plików wymaganych w cache,
- kompletność paczki ZIP.

## Aktualny stan

Zakończony etap: **Etap 7 — testowanie PWA**.

Projekt ma kompletną wersję MVP: formularz, walidację, obliczenia SAG-u, interpretację wyniku, responsywny wygląd mobile-first, podstawową dostępność, manifest PWA, service workera, cache offline i dokumentację testów.
