// ===================================================================
// 1. VARIÁVEIS E ESTADO GLOBAL
// ===================================================================
const searchForm = document.getElementById('search-form');
const pokemonInput = document.getElementById('pokemon-input');
const pokemonDisplay = document.getElementById('pokemon-display');
const galleryContainer = document.getElementById('gallery-container');
const paginationButtons = document.getElementById('pagination-buttons');

// Variáveis para controlar a paginação
let offset = 0;
const limit = 24; // Quantos Pokémon carregar por página
// script.js (na seção 1)

// ===================================================================
// 1. VARIÁVEIS E ESTADO GLOBAL
// ===================================================================
const themeToggleButton = document.getElementById('theme-toggle-button');
// ... (o resto das suas variáveis)


// ===== LÓGICA DO TEMA NOTURNO =====

// Verifica se o usuário já tem uma preferência salva
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleButton.innerText = '☀️ Modo Claro';
}

themeToggleButton.addEventListener('click', () => {
    // Adiciona ou remove a classe do body
    document.body.classList.toggle('dark-mode');

    // Salva a preferência do usuário no localStorage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        themeToggleButton.innerText = '☀️ Modo Claro';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggleButton.innerText = '🌙 Modo Noturno';
    }
});

// ===================================================================
// 2. LÓGICA DA ANIMAÇÃO E PAGINAÇÃO DA GALERIA
// ===================================================================

/**
 * Orquestra a mudança de página com animação.
 * @param {string} direction - 'next' ou 'previous'.
 */
const changePage = (direction) => {
    const slideOutClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const slideInClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

    galleryContainer.classList.add(slideOutClass);

    galleryContainer.addEventListener('animationend', async () => {
        if (direction === 'next') {
            offset += limit;
        } else {
            offset -= limit;
        }
        
        galleryContainer.innerHTML = '';
        await fetchAndDisplayPokemons();

        galleryContainer.classList.remove(slideOutClass);
        galleryContainer.classList.add(slideInClass);

        galleryContainer.addEventListener('animationend', () => {
            galleryContainer.classList.remove(slideInClass);
        }, { once: true });

    }, { once: true });
};

/**
 * Busca os Pokémon na ordem numérica correta (por ID) e os exibe na galeria.
 */
const fetchAndDisplayPokemons = async () => {
    try {
        const requests = [];
        const startId = offset + 1;
        
        for (let i = 0; i < limit; i++) {
            const pokemonId = startId + i;
            // O número total de Pokémon pode mudar, então paramos se o ID for maior que o conhecido.
            // Ajuste este número conforme novas gerações forem lançadas.
            const totalKnownPokemons = 1025; 
            if (pokemonId > totalKnownPokemons) break;
            requests.push(fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`).then(res => res.json()));
        }

        const pokemonData = await Promise.all(requests);

        galleryContainer.innerHTML = ''; // Garante que a galeria esteja limpa
        pokemonData.forEach(pokemon => createGalleryCardFromFullData(pokemon));

        updatePaginationButtons(1025); // Usamos um valor fixo para o total

    } catch (error) {
        galleryContainer.innerHTML = '<p class="error-text">Não foi possível carregar a galeria.</p>';
        console.error(error);
    }
};

/**
 * Cria um card individual para a galeria a partir dos dados completos do Pokémon.
 * @param {object} pokemonDetails - O objeto completo de dados do Pokémon.
 */
const createGalleryCardFromFullData = (pokemonDetails) => {
    const card = document.createElement('div');
    card.classList.add('gallery-card');
    card.innerHTML = `
        <img src="${pokemonDetails.sprites.front_default || 'placeholder.png'}" alt="${pokemonDetails.name}">
        <p>#${pokemonDetails.id.toString().padStart(3, '0')}</p>
        <p>${pokemonDetails.name}</p>
    `;

    card.addEventListener('click', () => {
        fetchPokemonData(pokemonDetails.name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    galleryContainer.appendChild(card);
};

/**
 * Cria e atualiza os botões "Anterior" e "Próxima".
 * @param {number} totalPokemons - O número total de Pokémon existentes.
 */
const updatePaginationButtons = (totalPokemons) => {
    paginationButtons.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.innerText = 'Anterior';
    prevButton.classList.add('pagination-button');
    prevButton.addEventListener('click', () => changePage('previous'));
    prevButton.disabled = offset === 0;

    const nextButton = document.createElement('button');
    nextButton.innerText = 'Próxima';
    nextButton.classList.add('pagination-button');
    nextButton.addEventListener('click', () => changePage('next'));
    nextButton.disabled = offset + limit >= totalPokemons;

    paginationButtons.appendChild(prevButton);
    paginationButtons.appendChild(nextButton);
};


// ===================================================================
// 3. LÓGICA DA BUSCA E EXIBIÇÃO PRINCIPAL
// ===================================================================

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const pokemonNameOrId = pokemonInput.value.toLowerCase().trim();
    if (pokemonNameOrId) {
        fetchPokemonData(pokemonNameOrId);
    }
});

const fetchPokemonData = async (pokemonNameOrId) => {
    try {
        pokemonDisplay.innerHTML = '<p class="placeholder-text">Carregando...</p>';

        const pokemonURL = `https://pokeapi.co/api/v2/pokemon/${pokemonNameOrId}`;
        const speciesURL = `https://pokeapi.co/api/v2/pokemon-species/${pokemonNameOrId}`;

        const [pokemonResponse, speciesResponse] = await Promise.all([
            fetch(pokemonURL),
            fetch(speciesURL)
        ]);

        if (!pokemonResponse.ok || !speciesResponse.ok) {
            throw new Error("Pokémon não encontrado!");
        }

        const pokemonData = await pokemonResponse.json();
        const speciesData = await speciesResponse.json();
        
        displayPokemon(pokemonData, speciesData);

    } catch (error) {
        pokemonDisplay.innerHTML = `<p class="error-text">${error.message}</p>`;
        console.error(error);
    }
};

const displayPokemon = (pokemonData, speciesData) => {
    const name = pokemonData.name;
    const id = pokemonData.id.toString().padStart(3, '0');
    const imageUrl = pokemonData.sprites.front_default; // <<< Imagem pixelada
    const types = pokemonData.types.map(typeInfo => typeInfo.type.name);
    const weight = pokemonData.weight / 10;
    const height = pokemonData.height / 10;

    const flavorTextEntry = speciesData.flavor_text_entries.find(
        (entry) => entry.language.name === 'en'
    );
    // Texto do fato curioso já corrigido e limpo
    const fact = flavorTextEntry ? flavorTextEntry.flavor_text.replace(/[\n\f]/g, ' ').replace(/pokémon/gi, 'Pokémon') : "Nenhuma descrição encontrada.";

    const pokemonCardHTML = `
        <div class="pokemon-info">
            <img src="${imageUrl}" alt="${name}">
            <h2>${name} (#${id})</h2>
        </div>
        <div class="pokemon-stats">
            <div class="stat">
                <strong>Tipo</strong>
                <span>${types.join(', ')}</span>
            </div>
            <div class="stat">
                <strong>Altura</strong>
                <span>${height} m</span>
            </div>
            <div class="stat">
                <strong>Peso</strong>
                <span>${weight} kg</span>
            </div>
        </div>
        <div class="pokemon-fact">
            <h3>Fato Curioso:</h3>
            <p>"${fact}"</p>
        </div>
    `;

    pokemonDisplay.innerHTML = pokemonCardHTML;
};


// ===================================================================
// 4. INICIALIZAÇÃO DA APLICAÇÃO
// ===================================================================

// Carrega o Pokémon em destaque inicial
fetchPokemonData('1');

// Carrega a primeira página da galeria
fetchAndDisplayPokemons();