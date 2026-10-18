const countriesContainer = document.getElementById("countries-container");
const searchInput = document.getElementById("search-input");
const regionFilter = document.getElementById("region-filter");
const sortFilter = document.getElementById("sort-filter");
const resetButton = document.getElementById("reset-btn");
const themeButton = document.getElementById("theme-btn");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("error-message");
const noResults = document.getElementById("no-results");
const totalCountries = document.getElementById("total-countries");
const totalPopulation = document.getElementById("total-population");
const totalRegions = document.getElementById("total-regions");
const visibleCount = document.getElementById("visible-count");
const detailsSection = document.getElementById("details-section");
const countryDetails = document.getElementById("country-details");
const closeDetailsButton = document.getElementById("close-details");

let allCountries = [];
let filteredCountries = [];

async function loadCountries() {
    loading.style.display = "block";
    errorMessage.textContent = "";
    countriesContainer.innerHTML = "";
    noResults.style.display = "none";

    try {
        const response = await fetch(
            "https://countries.dev/countries?full=true"
        );

        if (!response.ok) {
            throw new Error("API request failed: " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid country data received.");
        }

        allCountries = data.map(normalizeCountry);

        updateStatistics();
        applyFilters();

    } catch (error) {
        console.error("Country API Error:", error);

        errorMessage.textContent =
            "Unable to load countries. Please check your internet connection and try again.";

    } finally {
        loading.style.display = "none";
    }
}

function normalizeCountry(country) {
    const nativeName = country.nativeName
        ? {
            native: {
                common: country.nativeName
            }
        }
        : {};

    let currencies = {};

    if (Array.isArray(country.currencies)) {
        country.currencies.forEach(function (currency, index) {
            const key = currency.code || String(index);

            currencies[key] = {
                name: currency.name || "Unknown currency",
                symbol: currency.symbol || ""
            };
        });

    } else if (
        country.currencies &&
        typeof country.currencies === "object"
    ) {
        currencies = country.currencies;
    }

    let languages = {};

    if (Array.isArray(country.languages)) {
        country.languages.forEach(function (language, index) {
            const key =
                language.iso639_1 ||
                language.iso639_2 ||
                String(index);

            languages[key] =
                language.name ||
                language.nativeName ||
                String(language);
        });

    } else if (
        country.languages &&
        typeof country.languages === "object"
    ) {
        languages = country.languages;
    }

    const flags = country.flags || {};

    const flagUrl =
        flags.svg ||
        flags.png ||
        country.flag ||
        "";

    return {
        name: {
            common:
                country.name ||
                country.commonName ||
                "Unknown country",

            official:
                country.name ||
                country.officialName ||
                "Unknown country",

            nativeName: nativeName
        },

        flags: {
            svg: flags.svg || flagUrl,
            png: flags.png || flagUrl
        },

        population: Number(country.population) || 0,

        region: country.region || "",

        subregion: country.subregion || "",

        capital: Array.isArray(country.capital)
            ? country.capital
            : country.capital
                ? [country.capital]
                : [],

        languages: languages,

        currencies: currencies,

        borders: Array.isArray(country.borders)
            ? country.borders
            : [],

        cca2:
            country.alpha2Code ||
            country.alpha2 ||
            country.cca2 ||
            "",

        area: Number(country.area) || 0
    };
}
function updateStatistics() {
    totalCountries.textContent =
        allCountries.length.toLocaleString();

    const population = allCountries.reduce(
        function (total, country) {
            return total + country.population;
        },
        0
    );

    totalPopulation.textContent =
        population.toLocaleString();

    const regions = new Set(
        allCountries
            .map(function (country) {
                return country.region;
            })
            .filter(Boolean)
    );

    totalRegions.textContent =
        regions.size.toLocaleString();
}

function applyFilters() {
    const searchText =
        searchInput.value.trim().toLowerCase();

    const selectedRegion =
        regionFilter.value;

    filteredCountries = allCountries.filter(
        function (country) {
            const countryName =
                country.name.common.toLowerCase();

            const matchesName =
                countryName.includes(searchText);

            const matchesRegion =
                selectedRegion === "all" ||
                country.region === selectedRegion;

            return matchesName && matchesRegion;
        }
    );

    sortCountries();
    displayCountries();
}

function sortCountries() {
    const sortValue = sortFilter.value;

    filteredCountries.sort(function (a, b) {
        if (sortValue === "name-asc") {
            return a.name.common.localeCompare(
                b.name.common
            );
        }

        if (sortValue === "name-desc") {
            return b.name.common.localeCompare(
                a.name.common
            );
        }

        if (sortValue === "population-desc") {
            return b.population - a.population;
        }

        if (sortValue === "population-asc") {
            return a.population - b.population;
        }

        return 0;
    });
}

function displayCountries() {
    countriesContainer.innerHTML = "";

    detailsSection.classList.remove("show");

    const fragment =
        document.createDocumentFragment();

    filteredCountries.forEach(function (country) {
        const card =
            document.createElement("article");

        card.className = "country-card";

        const flag =
            document.createElement("img");

        flag.className = "country-flag";

        flag.src =
            country.flags.svg ||
            country.flags.png ||
            "";

        flag.alt =
            "Flag of " + country.name.common;

        flag.loading = "lazy";

        const info =
            document.createElement("div");

        info.className = "country-info";

        const name =
            document.createElement("h3");

        name.textContent =
            country.name.common;

        const capital =
            document.createElement("p");

        capital.innerHTML =
            "<strong>Capital:</strong> ";

        capital.appendChild(
            document.createTextNode(
                country.capital.join(", ") || "N/A"
            )
        );

        const population =
            document.createElement("p");

        population.innerHTML =
            "<strong>Population:</strong> ";

        population.appendChild(
            document.createTextNode(
                country.population.toLocaleString()
            )
        );

        const region =
            document.createElement("p");

        region.innerHTML =
            "<strong>Region:</strong> ";

        region.appendChild(
            document.createTextNode(
                country.region || "N/A"
            )
        );

        info.append(
            name,
            capital,
            population,
            region
        );

        card.append(
            flag,
            info
        );

        card.addEventListener("click", function () {
            showCountryDetails(country);
        });

        fragment.appendChild(card);
    });

    countriesContainer.appendChild(fragment);

    visibleCount.textContent =
        filteredCountries.length.toLocaleString();

    noResults.style.display =
        filteredCountries.length === 0
            ? "block"
            : "none";
}
function showCountryDetails(country) {
    const currencies = Object.values(
        country.currencies
    )
        .map(function (currency) {
            return currency.name +
                (
                    currency.symbol
                        ? " (" + currency.symbol + ")"
                        : ""
                );
        })
        .join(", ") || "N/A";

    const languages = Object.values(
        country.languages
    ).join(", ") || "N/A";

    const borders = country.borders.length
        ? country.borders.join(", ")
        : "No bordering countries";

    const capital =
        country.capital.join(", ") || "N/A";

    const nativeNames = Object.values(
        country.name.nativeName
    )
        .map(function (item) {
            return item.common;
        })
        .join(", ") || "N/A";

    const area = country.area
        ? country.area.toLocaleString() + " km²"
        : "N/A";

    countryDetails.innerHTML = "";

    const content =
        document.createElement("div");

    content.className = "details-content";

    const flag =
        document.createElement("img");

    flag.className = "details-flag";

    flag.src =
        country.flags.svg ||
        country.flags.png ||
        "";

    flag.alt =
        "Flag of " + country.name.common;

    const info =
        document.createElement("div");

    info.className = "details-info";

    const heading =
        document.createElement("h2");

    heading.textContent =
        country.name.common;

    info.appendChild(heading);

    const details = [
        [
            "Official Name",
            country.name.official || "N/A"
        ],
        [
            "Native Name",
            nativeNames
        ],
        [
            "Capital",
            capital
        ],
        [
            "Region",
            country.region || "N/A"
        ],
        [
            "Subregion",
            country.subregion || "N/A"
        ],
        [
            "Population",
            country.population.toLocaleString()
        ],
        [
            "Area",
            area
        ],
        [
            "Languages",
            languages
        ],
        [
            "Currencies",
            currencies
        ],
        [
            "Bordering Countries",
            borders
        ],
        [
            "Country Code",
            country.cca2 || "N/A"
        ]
    ];

    details.forEach(function (item) {
        const paragraph =
            document.createElement("p");

        const label =
            document.createElement("strong");

        label.textContent =
            item[0] + ": ";

        paragraph.appendChild(label);

        paragraph.appendChild(
            document.createTextNode(item[1])
        );

        info.appendChild(paragraph);
    });

    content.append(
        flag,
        info
    );

    countryDetails.appendChild(content);

    detailsSection.classList.add("show");

    detailsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
searchInput.addEventListener(
    "input",
    applyFilters
);

regionFilter.addEventListener(
    "change",
    applyFilters
);

sortFilter.addEventListener(
    "change",
    applyFilters
);

resetButton.addEventListener(
    "click",
    function () {
        searchInput.value = "";
        regionFilter.value = "all";
        sortFilter.value = "name-asc";

        applyFilters();
    }
);

closeDetailsButton.addEventListener(
    "click",
    function () {
        detailsSection.classList.remove("show");
    }
);

function updateThemeButton() {
    if (document.body.classList.contains("dark")) {
        themeButton.innerHTML =
            '<i class="fa-solid fa-sun"></i> Light Mode';
    } else {
        themeButton.innerHTML =
            '<i class="fa-solid fa-moon"></i> Dark Mode';
    }
}

function loadSavedTheme() {
    const savedTheme =
        localStorage.getItem("country-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }

    updateThemeButton();
}

themeButton.addEventListener(
    "click",
    function () {
        document.body.classList.toggle("dark");

        const currentTheme =
            document.body.classList.contains("dark")
                ? "dark"
                : "light";

        localStorage.setItem(
            "country-theme",
            currentTheme
        );

        updateThemeButton();
    }
);

loadSavedTheme();
loadCountries();