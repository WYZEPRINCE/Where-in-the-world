
class CountryExplorer {
    constructor() {
        this.countries = [];
        this.filteredCountries = [];
        this.currentView = 'home';
        this.currentRegion = '';
        this.currentSearch = '';
        
        this.initElements();
        this.initEventListeners();
        this.initTheme();
        this.loadCountries();
    }

    initElements() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        this.themeText = document.getElementById('themeText');
        this.backButton = document.getElementById('backButton');
        this.homeView = document.getElementById('homeView');
        this.detailView = document.getElementById('detailView');
        this.searchInput = document.getElementById('searchInput');
        this.filterButton = document.getElementById('filterButton');
        this.filterMenu = document.getElementById('filterMenu');
        this.filterText = document.getElementById('filterText');
        this.countriesGrid = document.getElementById('countriesGrid');
        this.detailContent = document.getElementById('detailContent');
    }

    initEventListeners() {
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.backButton.addEventListener('click', () => this.showHomeView());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.filterButton.addEventListener('click', () => this.toggleFilterMenu());
        
        this.filterMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-option')) {
                this.handleRegionFilter(e.target.dataset.region, e.target.textContent);
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.filterButton.contains(e.target) && !this.filterMenu.contains(e.target)) {
                this.filterMenu.classList.remove('active');
            }
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeButton(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeButton(newTheme);
    }

    updateThemeButton(theme) {
        if (theme === 'dark') {
            this.themeIcon.textContent = '☀️';
            this.themeText.textContent = 'Light Mode';
        } else {
            this.themeIcon.textContent = '🌙';
            this.themeText.textContent = 'Dark Mode';
        }
    }

    async loadCountries() {
        try {
            const response = await fetch('https://restcountries.com/v3.1/all');
            if (!response.ok) throw new Error('Failed to fetch countries');
            
            this.countries = await response.json();
            this.filteredCountries = [...this.countries];
            this.renderCountries();
        } catch (error) {
            this.countriesGrid.innerHTML = `
                <div class="error">
                    <h2>Error loading countries</h2>
                    <p>Please check your internet connection and try again.</p>
                </div>
            `;
        }
    }

    renderCountries() {
        if (this.filteredCountries.length === 0) {
            this.countriesGrid.innerHTML = '<div class="loading">No countries found</div>';
            return;
        }

        this.countriesGrid.innerHTML = this.filteredCountries.map(country => `
            <div class="country-card" onclick="app.showCountryDetail('${country.cca3}')">
                <img 
                    class="country-flag" 
                    src="${country.flags.svg}" 
                    alt="Flag of ${country.name.common}"
                    loading="lazy"
                >
                <div class="country-info">
                    <h2 class="country-name">${country.name.common}</h2>
                    <div class="country-details">
                        <div><strong>Population:</strong> ${this.formatNumber(country.population)}</div>
                        <div><strong>Region:</strong> ${country.region}</div>
                        <div><strong>Capital:</strong> ${country.capital?.[0] || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    handleSearch(query) {
        this.currentSearch = query.toLowerCase();
        this.applyFilters();
    }

    toggleFilterMenu() {
        this.filterMenu.classList.toggle('active');
    }

    handleRegionFilter(region, text) {
        this.currentRegion = region;
        this.filterText.textContent = text;
        this.filterMenu.classList.remove('active');
        this.applyFilters();
    }

    applyFilters() {
        this.filteredCountries = this.countries.filter(country => {
            const matchesSearch = !this.currentSearch || 
                country.name.common.toLowerCase().includes(this.currentSearch);
            
            const matchesRegion = !this.currentRegion || 
                country.region === this.currentRegion;
            
            return matchesSearch && matchesRegion;
        });
        
        this.renderCountries();
    }

    showCountryDetail(countryCode) {
        const country = this.countries.find(c => c.cca3 === countryCode);
        if (!country) return;

        this.renderCountryDetail(country);
        this.showDetailView();
    }

    renderCountryDetail(country) {
        const currencies = country.currencies ? 
            Object.values(country.currencies).map(c => c.name).join(', ') : 'N/A';
        
        const languages = country.languages ? 
            Object.values(country.languages).join(', ') : 'N/A';

        const nativeName = country.name.nativeName ? 
            Object.values(country.name.nativeName)[0]?.common || country.name.common :
            country.name.common;

        const topLevelDomain = country.tld?.[0] || 'N/A';

        this.detailContent.innerHTML = `
            <div>
                <img 
                    class="detail-flag" 
                    src="${country.flags.svg}" 
                    alt="Flag of ${country.name.common}"
                >
            </div>
            <div class="detail-info">
                <h1>${country.name.common}</h1>
                <div class="detail-stats">
                    <div>
                        <div><strong>Native Name:</strong> ${nativeName}</div>
                        <div><strong>Population:</strong> ${this.formatNumber(country.population)}</div>
                        <div><strong>Region:</strong> ${country.region}</div>
                        <div><strong>Sub Region:</strong> ${country.subregion || 'N/A'}</div>
                        <div><strong>Capital:</strong> ${country.capital?.[0] || 'N/A'}</div>
                    </div>
                    <div>
                        <div><strong>Top Level Domain:</strong> ${topLevelDomain}</div>
                        <div><strong>Currencies:</strong> ${currencies}</div>
                        <div><strong>Languages:</strong> ${languages}</div>
                    </div>
                </div>
                ${this.renderBorderCountries(country.borders)}
            </div>
        `;
    }

    renderBorderCountries(borders) {
        if (!borders || borders.length === 0) {
            return '';
        }

        const borderCountries = borders.map(border => {
            const borderCountry = this.countries.find(c => c.cca3 === border);
            return borderCountry ? {
                code: border,
                name: borderCountry.name.common
            } : null;
        }).filter(Boolean);

        if (borderCountries.length === 0) return '';

        return `
            <div class="border-countries">
                <h3>Border Countries:</h3>
                <div class="border-tags">
                    ${borderCountries.map(country => 
                        `<button class="border-tag" onclick="app.showCountryDetail('${country.code}')">
                            ${country.name}
                        </button>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    showHomeView() {
        this.currentView = 'home';
        this.homeView.classList.remove('active');
        this.detailView.classList.remove('active');
        this.backButton.style.display = 'none';
        this.homeView.style.display = 'block';
        this.detailView.style.display = 'none';
    }

    showDetailView() {
        this.currentView = 'detail';
        this.homeView.style.display = 'none';
        this.detailView.style.display = 'block';
        this.backButton.style.display = 'flex';
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }
}

// Initialize the app
const app = new CountryExplorer();
