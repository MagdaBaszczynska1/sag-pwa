/*
  Etap 4, 6 i 7: JavaScript, walidacja oraz rejestracja service workera.
  Ten plik odpowiada za:
  - pobranie danych z formularza,
  - zamianę tekstu na liczby,
  - walidację danych,
  - obliczenie SAG-u,
  - pokazanie wyniku lub komunikatów błędów,
  - uruchomienie mechanizmu offline przez service workera.
*/

(() => {
  "use strict";

  const TOLERANCE_PERCENTAGE_POINTS = 1;

  const form = document.getElementById("sag-form");
  const resultEmpty = document.getElementById("result-empty");
  const resultContent = document.getElementById("result-content");
  const resultCard = document.querySelector(".result-card");
  const pwaStatus = document.getElementById("pwa-status");

  const fields = {
    travelMm: {
      input: document.getElementById("travel-mm"),
      error: document.getElementById("travel-mm-error"),
    },
    measuredSagMm: {
      input: document.getElementById("measured-sag-mm"),
      error: document.getElementById("measured-sag-mm-error"),
    },
    targetSagPercent: {
      input: document.getElementById("target-sag-percent"),
      error: document.getElementById("target-sag-percent-error"),
    },
  };

  const output = {
    currentSag: document.getElementById("current-sag-result"),
    targetSagMm: document.getElementById("target-sag-mm-result"),
    difference: document.getElementById("difference-result"),
    interpretation: document.getElementById("interpretation-result"),
  };

  function parseLocalizedNumber(rawValue) {
    const normalizedValue = rawValue.trim().replace(",", ".");

    if (normalizedValue === "") {
      return {
        value: null,
        isValid: false,
        reason: "empty",
      };
    }

    const basicDecimalPattern = /^-?\d+(?:\.\d+)?$/;

    if (!basicDecimalPattern.test(normalizedValue)) {
      return {
        value: null,
        isValid: false,
        reason: "not-a-number",
      };
    }

    const numberValue = Number(normalizedValue);

    if (!Number.isFinite(numberValue)) {
      return {
        value: null,
        isValid: false,
        reason: "not-a-number",
      };
    }

    return {
      value: numberValue,
      isValid: true,
      reason: null,
    };
  }

  function calculateSag(travelMm, measuredSagMm, targetSagPercent) {
    const currentSagPercent = (measuredSagMm / travelMm) * 100;
    const targetSagMm = (travelMm * targetSagPercent) / 100;
    const differencePercentagePoints = currentSagPercent - targetSagPercent;
    const differenceMm = measuredSagMm - targetSagMm;

    return {
      currentSagPercent,
      targetSagMm,
      differencePercentagePoints,
      differenceMm,
    };
  }

  function interpretSag(differencePercentagePoints) {
    if (Math.abs(differencePercentagePoints) <= TOLERANCE_PERCENTAGE_POINTS) {
      return {
        text: "SAG bliski celu",
        status: "is-good",
      };
    }

    if (differencePercentagePoints < 0) {
      return {
        text: "SAG za mały",
        status: "is-low",
      };
    }

    return {
      text: "SAG za duży",
      status: "is-high",
    };
  }

  function formatNumber(value) {
    return value.toLocaleString("pl-PL", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  function formatSignedNumber(value) {
    const formattedValue = formatNumber(Math.abs(value));

    if (value > 0) {
      return `+${formattedValue}`;
    }

    if (value < 0) {
      return `-${formattedValue}`;
    }

    return formattedValue;
  }

  function setFieldError(field, message) {
    field.input.setAttribute("aria-invalid", "true");
    field.error.textContent = message;
  }

  function clearFieldError(field) {
    field.input.setAttribute("aria-invalid", "false");
    field.error.textContent = "";
  }

  function clearAllErrors() {
    Object.values(fields).forEach(clearFieldError);
  }

  function hideResult() {
    resultEmpty.hidden = false;
    resultContent.hidden = true;
    resultCard.classList.remove("is-good", "is-low", "is-high");

    output.currentSag.textContent = "—";
    output.targetSagMm.textContent = "—";
    output.difference.textContent = "—";
    output.interpretation.textContent = "—";
  }

  function validateFormValues() {
    const invalidInputs = [];

    const travel = parseLocalizedNumber(fields.travelMm.input.value);
    const measuredSag = parseLocalizedNumber(fields.measuredSagMm.input.value);
    const targetSag = parseLocalizedNumber(fields.targetSagPercent.input.value);

    if (!travel.isValid) {
      const message = travel.reason === "empty"
        ? "Podaj skok zawieszenia w milimetrach."
        : "Skok zawieszenia musi być liczbą, np. 160 albo 160,5.";
      setFieldError(fields.travelMm, message);
      invalidInputs.push(fields.travelMm.input);
    } else if (travel.value <= 0) {
      setFieldError(fields.travelMm, "Skok zawieszenia musi być większy od 0.");
      invalidInputs.push(fields.travelMm.input);
    }

    if (!measuredSag.isValid) {
      const message = measuredSag.reason === "empty"
        ? "Podaj zmierzone ugięcie w milimetrach."
        : "Zmierzone ugięcie musi być liczbą, np. 32 albo 32,5.";
      setFieldError(fields.measuredSagMm, message);
      invalidInputs.push(fields.measuredSagMm.input);
    } else if (measuredSag.value < 0) {
      setFieldError(fields.measuredSagMm, "Zmierzone ugięcie nie może być ujemne.");
      invalidInputs.push(fields.measuredSagMm.input);
    }

    if (!targetSag.isValid) {
      const message = targetSag.reason === "empty"
        ? "Podaj docelowy SAG w procentach."
        : "Docelowy SAG musi być liczbą, np. 20 albo 27,5.";
      setFieldError(fields.targetSagPercent, message);
      invalidInputs.push(fields.targetSagPercent.input);
    } else if (targetSag.value <= 0 || targetSag.value >= 100) {
      setFieldError(fields.targetSagPercent, "Docelowy SAG musi być większy od 0 i mniejszy niż 100%.");
      invalidInputs.push(fields.targetSagPercent.input);
    }

    if (
      travel.isValid
      && measuredSag.isValid
      && travel.value > 0
      && measuredSag.value > travel.value
    ) {
      setFieldError(fields.measuredSagMm, "Zmierzone ugięcie nie może być większe niż skok zawieszenia.");
      invalidInputs.push(fields.measuredSagMm.input);
    }

    return {
      isValid: invalidInputs.length === 0,
      invalidInputs,
      values: {
        travelMm: travel.value,
        measuredSagMm: measuredSag.value,
        targetSagPercent: targetSag.value,
      },
    };
  }

  function showResult(result, interpretation) {
    output.currentSag.textContent = `${formatNumber(result.currentSagPercent)}%`;
    output.targetSagMm.textContent = `${formatNumber(result.targetSagMm)} mm`;
    output.difference.textContent = `${formatSignedNumber(result.differencePercentagePoints)} p.p. / ${formatSignedNumber(result.differenceMm)} mm`;
    output.interpretation.textContent = interpretation.text;

    resultEmpty.hidden = true;
    resultContent.hidden = false;
    resultCard.classList.remove("is-good", "is-low", "is-high");
    resultCard.classList.add(interpretation.status);
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearAllErrors();
    hideResult();

    const validation = validateFormValues();

    if (!validation.isValid) {
      validation.invalidInputs[0].focus();
      return;
    }

    const result = calculateSag(
      validation.values.travelMm,
      validation.values.measuredSagMm,
      validation.values.targetSagPercent,
    );
    const interpretation = interpretSag(result.differencePercentagePoints);

    showResult(result, interpretation);
  }

  function handleReset() {
    window.setTimeout(() => {
      clearAllErrors();
      hideResult();
    }, 0);
  }

  function updatePwaStatus(message) {
    if (!pwaStatus) {
      return;
    }

    pwaStatus.textContent = message;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      updatePwaStatus("Ta przeglądarka nie obsługuje service workera, więc tryb offline nie jest dostępny.");
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then(() => {
          updatePwaStatus("Tryb offline jest przygotowany. Po pierwszym załadowaniu aplikacja może działać bez internetu.");
        })
        .catch(() => {
          updatePwaStatus("Nie udało się uruchomić trybu offline. Sprawdź, czy aplikacja działa przez HTTPS albo localhost.");
        });
    });
  }

  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", handleReset);

  registerServiceWorker();

  // Mały eksport edukacyjny ułatwia testowanie czystych funkcji w konsoli przeglądarki.
  window.SagCalculator = {
    parseLocalizedNumber,
    calculateSag,
    interpretSag,
  };
})();
